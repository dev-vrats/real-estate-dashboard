import re

with open('web/app/page.tsx', 'r') as f:
    content = f.read()

# 1. Fix Recharts imports by aggregating them
recharts_imports = set()
lines = content.split('\n')
new_lines = []

for line in lines:
    if line.startswith('import ') and 'from "recharts"' in line:
        match = re.search(r'\{([^}]+)\}', line)
        if match:
            items = match.group(1).split(',')
            for item in items:
                recharts_imports.add(item.strip())
    else:
        new_lines.append(line)

if recharts_imports:
    recharts_import_line = f'import {{ {", ".join(sorted(list(recharts_imports)))} }} from "recharts";'
    new_lines.insert(2, recharts_import_line)

content = '\n'.join(new_lines)

# 2. Fix duplicate `export function cn`
cn_decl = 'export function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}'
if content.count(cn_decl) > 1:
    content = content.replace(cn_decl, '', content.count(cn_decl) - 1)

# Fix duplicate `BentoCard` (just in case)
bc_decl = 'export function BentoCard({ children, className, ...props }: BentoCardProps) {'
if content.count(bc_decl) > 1:
    # This is trickier because BentoCard has a large body.
    pass

with open('web/app/page.tsx', 'w') as f:
    f.write(content)
