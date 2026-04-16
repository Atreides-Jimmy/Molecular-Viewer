#!/usr/bin/env python3
"""
从Gaussian结构优化Log文件中提取最后结构并生成gjf文件
支持正常结束和Error termination的log文件
自动根据原子间距离判断键连关系和键级
"""

import sys
import os
import re
import math
import argparse


def check_termination(content):
    """检查log文件的终止状态"""
    if 'Error termination' in content:
        error_match = re.search(r'Error termination.*?(\w+\.exe)', content)
        if error_match:
            return f"Error termination ({error_match.group(1)})"
        return "Error termination"
    elif 'Normal termination' in content:
        return "Normal termination"
    else:
        return "Unknown termination"


def extract_last_structure(log_file, structure_index=None):
    """
    从Log文件中提取优化的结构
    参数:
        log_file: log文件路径
        structure_index: 结构索引(从1开始)，None表示最后一个结构
    返回: (原子列表, 坐标列表, 电荷, 自旋多重度, 终止状态, 总结构数)
    """
    with open(log_file, 'r') as f:
        content = f.read()
    
    termination_status = check_termination(content)
    
    pattern = r'Standard orientation:.*?\n\s*-+\n.*?-+\n(.*?)\n\s*-+'
    matches = re.findall(pattern, content, re.DOTALL)
    
    if not matches:
        pattern = r'Input orientation:.*?\n\s*-+\n.*?-+\n(.*?)\n\s*-+'
        matches = re.findall(pattern, content, re.DOTALL)
    
    if not matches:
        raise ValueError("未找到结构信息 (Standard orientation 或 Input orientation)")
    
    total_structures = len(matches)
    
    if structure_index is None:
        selected_structure = matches[-1]
        actual_index = total_structures
    else:
        if structure_index < 1 or structure_index > total_structures:
            raise ValueError(f"结构索引超出范围: 请求第 {structure_index} 个结构，但只有 {total_structures} 个结构可用")
        selected_structure = matches[structure_index - 1]
        actual_index = structure_index
    
    atoms = []
    coords = []
    
    for line in selected_structure.strip().split('\n'):
        parts = line.split()
        if len(parts) >= 6:
            try:
                atomic_num = int(parts[1])
                x = float(parts[3])
                y = float(parts[4])
                z = float(parts[5])
                atoms.append(atomic_num)
                coords.append((x, y, z))
            except (ValueError, IndexError):
                continue
    
    charge = 0
    mult = 1
    
    charge_pattern = r'Charge\s*=\s*(-?\d+)\s*Multiplicity\s*=\s*(\d+)'
    charge_match = re.search(charge_pattern, content)
    if charge_match:
        charge = int(charge_match.group(1))
        mult = int(charge_match.group(2))
    
    return atoms, coords, charge, mult, termination_status, total_structures


def atomic_num_to_symbol(atomic_num):
    """将原子序数转换为元素符号"""
    elements = {
        1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O',
        9: 'F', 10: 'Ne', 11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P',
        16: 'S', 17: 'Cl', 18: 'Ar', 19: 'K', 20: 'Ca', 21: 'Sc', 22: 'Ti',
        23: 'V', 24: 'Cr', 25: 'Mn', 26: 'Fe', 27: 'Co', 28: 'Ni', 29: 'Cu',
        30: 'Zn', 31: 'Ga', 32: 'Ge', 33: 'As', 34: 'Se', 35: 'Br', 36: 'Kr',
        37: 'Rb', 38: 'Sr', 39: 'Y', 40: 'Zr', 41: 'Nb', 42: 'Mo', 43: 'Tc',
        44: 'Ru', 45: 'Rh', 46: 'Pd', 47: 'Ag', 48: 'Cd', 49: 'In', 50: 'Sn',
        51: 'Sb', 52: 'Te', 53: 'I', 54: 'Xe', 55: 'Cs', 56: 'Ba', 57: 'La',
        58: 'Ce', 59: 'Pr', 60: 'Nd', 61: 'Pm', 62: 'Sm', 63: 'Eu', 64: 'Gd',
        65: 'Tb', 66: 'Dy', 67: 'Ho', 68: 'Er', 69: 'Tm', 70: 'Yb', 71: 'Lu',
        72: 'Hf', 73: 'Ta', 74: 'W', 75: 'Re', 76: 'Os', 77: 'Ir', 78: 'Pt',
        79: 'Au', 80: 'Hg', 81: 'Tl', 82: 'Pb', 83: 'Bi', 84: 'Po', 85: 'At',
        86: 'Rn', 87: 'Fr', 88: 'Ra', 89: 'Ac', 90: 'Th', 91: 'Pa', 92: 'U',
        93: 'Np', 94: 'Pu', 95: 'Am', 96: 'Cm', 97: 'Bk', 98: 'Cf', 99: 'Es',
        100: 'Fm', 101: 'Md', 102: 'No', 103: 'Lr'
    }
    return elements.get(atomic_num, f'X{atomic_num}')


COVALENT_RADII = {
    1: 0.31, 2: 0.28, 3: 1.28, 4: 0.96, 5: 0.84, 6: 0.76, 7: 0.71, 8: 0.66,
    9: 0.57, 10: 0.58, 11: 1.66, 12: 1.41, 13: 1.21, 14: 1.11, 15: 1.07,
    16: 1.05, 17: 1.02, 18: 1.06, 19: 2.03, 20: 1.76, 21: 1.70, 22: 1.60,
    23: 1.53, 24: 1.39, 25: 1.39, 26: 1.32, 27: 1.26, 28: 1.24, 29: 1.32,
    30: 1.22, 31: 1.22, 32: 1.20, 33: 1.19, 34: 1.20, 35: 1.20, 36: 1.16,
    37: 2.20, 38: 1.95, 39: 1.90, 40: 1.75, 41: 1.64, 42: 1.54, 43: 1.47,
    44: 1.46, 45: 1.42, 46: 1.39, 47: 1.45, 48: 1.44, 49: 1.42, 50: 1.39,
    51: 1.39, 52: 1.38, 53: 1.39, 54: 1.40, 55: 2.44, 56: 2.15, 57: 2.07,
    58: 2.04, 59: 2.03, 60: 2.01, 61: 1.99, 62: 1.98, 63: 1.98, 64: 1.96,
    65: 1.94, 66: 1.92, 67: 1.92, 68: 1.89, 69: 1.90, 70: 1.87, 71: 1.87,
    72: 1.75, 73: 1.70, 74: 1.62, 75: 1.51, 76: 1.44, 77: 1.41, 78: 1.36,
    79: 1.36, 80: 1.32, 81: 1.45, 82: 1.46, 83: 1.48, 84: 1.40, 85: 1.50,
    86: 1.50, 87: 2.60, 88: 2.21, 89: 2.15, 90: 2.06, 91: 2.00, 92: 1.96,
    93: 1.90, 94: 1.87, 95: 1.80, 96: 1.69, 97: 1.68, 98: 1.68, 99: 1.65,
    100: 1.67, 101: 1.73, 102: 1.76, 103: 1.61
}

BOND_ORDER_THRESHOLDS = {
    'triple': 0.72,
    'double': 0.93,
}


def calculate_distance(coord1, coord2):
    """计算两个原子之间的距离"""
    return math.sqrt(
        (coord1[0] - coord2[0])**2 +
        (coord1[1] - coord2[1])**2 +
        (coord1[2] - coord2[2])**2
    )


def estimate_bond_order(atom1, atom2, distance):
    """
    根据原子类型和距离估算键级
    返回: 1.0 (单键), 2.0 (双键), 3.0 (三键)
    """
    r1 = COVALENT_RADII.get(atom1, 1.5)
    r2 = COVALENT_RADII.get(atom2, 1.5)
    
    expected_single = r1 + r2
    ratio = distance / expected_single
    
    if ratio <= BOND_ORDER_THRESHOLDS['triple']:
        return 3.0
    elif ratio <= BOND_ORDER_THRESHOLDS['double']:
        return 2.0
    else:
        return 1.0


def detect_bonds(atoms, coords, tolerance=0.4):
    """
    检测分子中的键连关系
    参数:
        atoms: 原子序数列表
        coords: 坐标列表
        tolerance: 共价半径和的容差(Å)
    返回:
        bonds: 字典 {原子索引: [(连接原子索引, 键级), ...]}
    """
    bonds = {i: [] for i in range(len(atoms))}
    
    for i in range(len(atoms)):
        for j in range(i + 1, len(atoms)):
            distance = calculate_distance(coords[i], coords[j])
            
            r1 = COVALENT_RADII.get(atoms[i], 1.5)
            r2 = COVALENT_RADII.get(atoms[j], 1.5)
            max_bond_distance = r1 + r2 + tolerance
            
            if distance <= max_bond_distance:
                bond_order = estimate_bond_order(atoms[i], atoms[j], distance)
                bonds[i].append((j, bond_order))
                bonds[j].append((i, bond_order))
    
    return bonds


def write_gjf(output_file, atoms, coords, charge, mult, method='B3LYP/6-31G(d)', log_file=None, 
              route_extra='', add_connectivity=True):
    """生成gjf文件"""
    if log_file:
        log_filename = os.path.basename(log_file)
        title = f"Generated from {log_filename}"
    else:
        title = "Generated from Gaussian log file"
    bonds = detect_bonds(atoms, coords) if add_connectivity else None
    
    with open(output_file, 'w') as f:
        f.write(f"%chk={os.path.splitext(output_file)[0]}.chk\n")
        route_line = f"# {method} opt"
        if add_connectivity:
            route_line += " geom=connectivity"
        if route_extra:
            route_line += f" {route_extra}"
        f.write(f"{route_line}\n\n")
        f.write(f"{title}\n\n")
        f.write(f"{charge} {mult}\n")
        
        for atom, (x, y, z) in zip(atoms, coords):
            symbol = atomic_num_to_symbol(atom)
            f.write(f"{symbol:2s}    {x:14.8f}    {y:14.8f}    {z:14.8f}\n")
        
        f.write("\n")
        
        if bonds:
            for i in range(len(atoms)):
                line_parts = [f" {i+1}"]
                for connected_atom, bond_order in bonds[i]:
                    if connected_atom > i:
                        line_parts.append(f" {connected_atom+1} {bond_order:.1f}")
                f.write("".join(line_parts) + "\n")
            
            f.write("\n")


def main():
    parser = argparse.ArgumentParser(
        description='从Gaussian结构优化Log文件中提取结构并生成gjf文件',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''示例:
  python log2gjf.py opt.log                          # 提取最后一个结构
  python log2gjf.py opt.log -n 5                     # 提取第5个结构
  python log2gjf.py opt.log result.gjf               # 指定输出文件名
  python log2gjf.py opt.log -n 3 -m "M062X/def2TZVP" # 指定方法和结构索引
  
功能:
  - 自动识别正常结束和Error termination的log文件
  - 提取指定优化步骤的结构(默认为最后一个)
  - 自动读取电荷和自旋多重度
  - 自动检测键连关系并估算键级
  
提示: 如需键级检查和修正功能，请使用 bond_checker.py'''
    )
    
    parser.add_argument('input_log', help='输入的Gaussian log文件')
    parser.add_argument('output_gjf', nargs='?', help='输出的gjf文件名(可选，默认为输入文件名_opt.gjf)')
    parser.add_argument('-n', '--structure-number', type=int, default=None,
                        metavar='N', help='提取第N个优化结构(从1开始)，默认为最后一个结构')
    parser.add_argument('-m', '--method', default='B3LYP/6-31G(d)',
                        help='计算方法(默认: B3LYP/6-31G(d))')
    
    args = parser.parse_args()
    
    log_file = args.input_log
    
    if not os.path.exists(log_file):
        print(f"错误: 文件 '{log_file}' 不存在")
        sys.exit(1)
    
    if args.output_gjf:
        output_file = args.output_gjf
    else:
        output_file = os.path.splitext(log_file)[0] + '_opt.gjf'
    
    method = args.method
    structure_index = args.structure_number
    
    print(f"正在读取: {log_file}")
    
    try:
        atoms, coords, charge, mult, termination, total_structures = extract_last_structure(
            log_file, structure_index)
    except ValueError as e:
        print(f"错误: {e}")
        sys.exit(1)
    
    if structure_index is None:
        print(f"提取结构: 最后一个 (共 {total_structures} 个优化结构)")
    else:
        print(f"提取结构: 第 {structure_index} 个 (共 {total_structures} 个优化结构)")
    
    print(f"终止状态: {termination}")
    print(f"找到 {len(atoms)} 个原子")
    print(f"电荷: {charge}, 自旋多重度: {mult}")
    
    if 'Error' in termination:
        print(f"\n{'='*50}")
        print("警告: 此log文件为Error termination!")
        print("已提取计算得到的最后一个结构")
        print("建议检查结构是否合理后再进行后续计算")
        print(f"{'='*50}\n")
    
    write_gjf(output_file, atoms, coords, charge, mult, method, log_file=log_file)
    
    print(f"已生成: {output_file}")
    print("已自动添加键连信息和键级 (geom=connectivity)")
    print("\n提示: 如需检查和修正键级，请运行:")
    print(f"  python bond_checker.py {output_file}")


if __name__ == '__main__':
    main()
