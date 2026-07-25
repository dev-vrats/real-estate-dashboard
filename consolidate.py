import os

components_dir = "web/components"
page_file = "web/app/page.tsx"

imports = set()
code_blocks = []

with open(page_file, "r") as f:
    page_content = f.read()

files_to_read = [os.path.join(components_dir, f) for f in os.listdir(components_dir) if f.endswith(".tsx")]

all_content = []
for file in files_to_read:
    with open(file, "r") as f:
        content = f.read()
        content = content.replace('"use client";\n', '')
        lines = content.split('\n')
        code_lines = []
        for line in lines:
            if line.startswith('import '):
                if '"./' not in line and "'./" not in line and "@/components" not in line:
                    imports.add(line)
            else:
                if "export function cn" not in line and "export function BentoCard" not in line:
                    code_lines.append(line)
        
        all_content.append("\n".join(code_lines))

page_lines = page_content.replace('"use client";\n', '').split('\n')
page_code = []
for line in page_lines:
    if line.startswith('import '):
        if "@/components" not in line and '"../public/data.json"' not in line:
            imports.add(line)
    else:
        page_code.append(line)

imports.add('import data from "../public/data.json";')
imports.add('import { twMerge } from "tailwind-merge";')
imports.add('import { clsx, type ClassValue } from "clsx";')
imports.add('import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, useInView } from "framer-motion";')
imports.add('import { HTMLMotionProps } from "framer-motion";')
imports.add('import React, { useRef, useEffect, useState, useMemo } from "react";')

# Ensure we remove duplicate imports inside the set manually
final_imports = []
for i in imports:
    if "framer-motion" not in i and "react" not in i and "clsx" not in i and "tailwind-merge" not in i:
        final_imports.append(i)

# Add our curated top imports
final_imports.insert(0, 'import { HTMLMotionProps } from "framer-motion";')
final_imports.insert(0, 'import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, useInView } from "framer-motion";')
final_imports.insert(0, 'import { clsx, type ClassValue } from "clsx";')
final_imports.insert(0, 'import { twMerge } from "tailwind-merge";')
final_imports.insert(0, 'import React, { useRef, useEffect, useState, useMemo } from "react";')

combined_code = "\n".join(all_content)

# We removed BentoCard and cn inside the loop to avoid duplication, so let's add them back once
common_utils = """
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BentoCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function BentoCard({ children, className, ...props }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
  
  const shouldReduceMotion = useReducedMotion();
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || shouldReduceMotion) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: shouldReduceMotion ? 0 : rotateX,
        rotateY: shouldReduceMotion ? 0 : rotateY,
        transformPerspective: 1000,
      }}
      className={cn(
        "relative rounded-2xl border border-card-border bg-card/60 backdrop-blur-xl p-6 shadow-xl transition-colors hover:bg-card/80",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
"""

final_output = '"use client";\n\n' + "\n".join(final_imports) + "\n\n" + common_utils + "\n" + combined_code + "\n\n" + "\n".join(page_code)

with open(page_file, "w") as f:
    f.write(final_output)

print("Consolidated successfully!")
