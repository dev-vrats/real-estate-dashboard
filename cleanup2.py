with open('web/app/page.tsx', 'r') as f:
    lines = f.readlines()

# delete lines 80 to 143 (which is index 79 to 142)
new_lines = lines[:79] + lines[143:]

with open('web/app/page.tsx', 'w') as f:
    f.writelines(new_lines)
