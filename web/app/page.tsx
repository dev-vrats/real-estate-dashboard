"use client";

import { Calculator, TrendingDown, TrendingUp } from "lucide-react";

import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, useInView } from "framer-motion";
import { HTMLMotionProps } from "framer-motion";
import data from "../public/data.json";

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




interface CityStat {
  city: string;
  avgPrice: number;
}

interface CityCompareChartProps {
  data: CityStat[];
  selectedCity: string | null;
}

export function CityCompareChart({ data, selectedCity }: CityCompareChartProps) {
  // Sort data so the highest is at the top of the horizontal chart
  const sortedData = [...data].sort((a, b) => a.avgPrice - b.avgPrice);
  
  return (
    <BentoCard className="flex flex-col h-full min-h-[300px]">
      <h3 className="font-display text-xl font-semibold mb-4">City Price Comparison</h3>
      <div className="flex-1 w-full h-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2A3040" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="city" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#F1EFE9', fontSize: 12, fontFamily: 'var(--font-sans)' }} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(42, 48, 64, 0.4)' }}
              contentStyle={{ backgroundColor: '#1A1E2A', borderColor: '#2A3040', borderRadius: '8px', color: '#F1EFE9' }}
              itemStyle={{ color: '#C9A227', fontFamily: 'var(--font-mono)' }}
              formatter={(value: any) => [`₹${(Number(value) / 100000).toFixed(2)} Lacs`, 'Avg Price']}
            />
            <Bar dataKey="avgPrice" radius={[0, 4, 4, 0]} barSize={20}>
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={selectedCity && selectedCity !== entry.city ? 'var(--color-card-border)' : 'var(--color-accent-gold)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}



export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-IN").format(
          Math.floor(latest)
        );
      }
    });
  }, [springValue]);

  return <span ref={ref} suppressHydrationWarning />;
}



interface CityStat {
  city: string;
  avgPrice: number;
}

interface Summary {
  totalProperties: number;
  avgPrice: number;
  mostExpensiveCity: string;
  mostAffordableCity: string;
}

interface HeroSkylineProps {
  cityStats: CityStat[];
  summary: Summary;
}

export function HeroSkyline({ cityStats, summary }: HeroSkylineProps) {
  // Find max price to normalize heights
  const maxPrice = Math.max(...cityStats.map((c) => c.avgPrice));

  return (
    <BentoCard className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
      <Meteors number={20} />
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="z-10 relative">
        <h2 className="font-display text-4xl font-bold tracking-tight mb-2">Market Overview</h2>
        <p className="text-muted font-sans text-lg mb-8 max-w-md">
          A spatial perspective on the real estate landscape across major metropolitan areas.
        </p>

        <div className="grid grid-cols-2 gap-6 mt-4">
          <div className="flex flex-col">
            <span className="text-muted text-sm uppercase tracking-wider mb-1">Total Properties</span>
            <span suppressHydrationWarning className="font-mono text-3xl text-accent-gold">
              <AnimatedNumber value={summary.totalProperties} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted text-sm uppercase tracking-wider mb-1">National Average</span>
            <span suppressHydrationWarning className="font-mono text-3xl text-accent-blue">
              ₹<AnimatedNumber value={summary.avgPrice / 100000} />L
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted text-sm uppercase tracking-wider mb-1">Premium Hub</span>
            <span className="font-mono text-2xl text-primary">{summary.mostExpensiveCity}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted text-sm uppercase tracking-wider mb-1">Value Hub</span>
            <span className="font-mono text-2xl text-primary">{summary.mostAffordableCity}</span>
          </div>
        </div>
      </div>

      {/* Animated Skyline Background */}
      <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end justify-between px-4 opacity-40 pointer-events-none">
        {cityStats.map((stat, i) => {
          const heightPct = (stat.avgPrice / maxPrice) * 100;
          return (
            <div key={stat.city} className="flex flex-col items-center flex-1 mx-1 group">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                className="w-full bg-gradient-to-t from-accent-gold/20 to-accent-gold/80 rounded-t-sm"
              />
              <span className="font-mono text-[10px] text-muted mt-2 opacity-50 truncate max-w-full">
                {stat.city.substring(0, 3).toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Subtle overlay to fade out skyline near text */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-card/80 to-transparent pointer-events-none z-0" />
    </BentoCard>
  );
}



interface FilterBarProps {
  cities: string[];
  propertyTypes: string[];
  selectedCity: string | null;
  selectedType: string | null;
  onCityChange: (city: string | null) => void;
  onTypeChange: (type: string | null) => void;
}

export function FilterBar({ 
  cities, 
  propertyTypes, 
  selectedCity, 
  selectedType, 
  onCityChange, 
  onTypeChange 
}: FilterBarProps) {
  return (
    <div className="w-full flex flex-col sm:flex-row gap-4 mb-8 pt-4 pb-6 border-b border-card-border">
      <div className="flex flex-col">
        <label className="text-xs uppercase tracking-widest text-muted mb-2">Location</label>
        <select 
          className="bg-card border border-card-border text-primary rounded-lg px-4 py-2 focus:outline-none focus:border-accent-gold appearance-none min-w-[200px]"
          value={selectedCity || ""}
          onChange={(e) => onCityChange(e.target.value || null)}
        >
          <option value="">All Locations</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs uppercase tracking-widest text-muted mb-2">Property Type</label>
        <select 
          className="bg-card border border-card-border text-primary rounded-lg px-4 py-2 focus:outline-none focus:border-accent-teal appearance-none min-w-[200px]"
          value={selectedType || ""}
          onChange={(e) => onTypeChange(e.target.value || null)}
        >
          <option value="">All Property Types</option>
          {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
}



interface YearlyTrend {
  year: number;
  avgPrice: number;
}

interface YearlyTrendByCity {
  year: number;
  city: string;
  avgPrice: number;
}

interface TrendChartProps {
  yearlyTrend: YearlyTrend[];
  yearlyTrendByCity: YearlyTrendByCity[];
  selectedCity: string | null;
}

export function TrendChart({ yearlyTrend, yearlyTrendByCity, selectedCity }: TrendChartProps) {
  const [view, setView] = useState<"overall" | "city">("overall");

  // Transform city data for Recharts (group by year, columns as cities)
  const processedCityData = Object.values(
    yearlyTrendByCity.reduce((acc, curr) => {
      if (!acc[curr.year]) acc[curr.year] = { year: curr.year };
      acc[curr.year][curr.city] = curr.avgPrice;
      return acc;
    }, {} as Record<number, any>)
  ).sort((a, b) => a.year - b.year);

  // Extract unique cities
  const cities = Array.from(new Set(yearlyTrendByCity.map(d => d.city)));
  
  const colors = ['#C9A227', '#34C6B8', '#F1EFE9', '#8B92A5', '#2AA499', '#D4AF37'];

  return (
    <BentoCard className="col-span-1 md:col-span-2 lg:col-span-3 h-[350px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-xl font-semibold">Market Trend</h3>
        <div className="flex bg-card-border/50 rounded-lg p-1">
          <button 
            className={`px-3 py-1 text-xs rounded-md transition-colors ${view === 'overall' ? 'bg-card-border text-primary' : 'text-muted hover:text-primary'}`}
            onClick={() => setView('overall')}
          >
            Overall
          </button>
          <button 
            className={`px-3 py-1 text-xs rounded-md transition-colors ${view === 'city' ? 'bg-card-border text-primary' : 'text-muted hover:text-primary'}`}
            onClick={() => setView('city')}
          >
            By City
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full h-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={view === 'overall' ? yearlyTrend : processedCityData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A3040" />
            <XAxis dataKey="year" stroke="#8B92A5" tick={{ fill: '#8B92A5', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis 
              stroke="#8B92A5" 
              tick={{ fill: '#8B92A5', fontSize: 12, fontFamily: 'var(--font-mono)' }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1A1E2A', borderColor: '#2A3040', borderRadius: '8px', color: '#F1EFE9' }}
              itemStyle={{ fontFamily: 'var(--font-mono)' }}
              formatter={(value: any) => [`₹${(Number(value) / 100000).toFixed(2)} Lacs`, '']}
              labelStyle={{ color: '#8B92A5', marginBottom: '8px' }}
            />
            {view === 'overall' ? (
              <Line 
                type="monotone" 
                dataKey="avgPrice" 
                stroke="var(--color-accent-gold)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-accent-gold)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ) : (
              cities.map((city, index) => {
                const isSelected = selectedCity ? selectedCity === city : true;
                return (
                  <Line 
                    key={city}
                    type="monotone" 
                    dataKey={city} 
                    stroke={colors[index % colors.length]} 
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={isSelected ? 1 : 0.2}
                    dot={false}
                    activeDot={isSelected ? { r: 4 } : false}
                  />
                );
              })
            )}
            {view === 'city' && <Legend wrapperStyle={{ fontSize: '12px', color: '#8B92A5' }} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}



interface ScatterCorrelationProps {
  slope: number;
  intercept: number;
  correlation: number;
}

export function ScatterCorrelation({ slope, intercept, correlation }: ScatterCorrelationProps) {
  // Generate synthetic points based on slope and intercept for the visual
  const data = useMemo(() => {
    const points = [];
    for (let i = 0; i < 50; i++) {
      const area = Math.floor(Math.random() * 4000) + 500;
      // Add noise based on correlation. If corr is high, less noise.
      const noiseLevel = (1 - Math.abs(correlation)) * 2 * slope * area;
      const noise = (Math.random() - 0.5) * noiseLevel;
      const price = Math.max(0, slope * area + intercept + noise);
      points.push({ area, price });
    }
    
    // Add two points strictly for the regression line
    const lineStart = { area: 500, priceLine: slope * 500 + intercept };
    const lineEnd = { area: 4500, priceLine: slope * 4500 + intercept };
    
    return { points, line: [lineStart, lineEnd] };
  }, [slope, intercept, correlation]);

  return (
    <BentoCard className="flex flex-col h-full min-h-[250px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-xl font-semibold">Area vs Price</h3>
        <span className="text-xs text-muted bg-card-border px-2 py-1 rounded-md">
          r = {correlation}
        </span>
      </div>
      <div className="flex-1 w-full h-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <XAxis 
              dataKey="area" 
              type="number" 
              name="Area" 
              unit=" sqft"
              tick={{ fill: '#8B92A5', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              dataKey="price" 
              type="number" 
              name="Price"
              tick={{ fill: '#8B92A5', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `₹${(val / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#1A1E2A', borderColor: '#2A3040', borderRadius: '8px', color: '#F1EFE9' }}
              itemStyle={{ fontFamily: 'var(--font-mono)' }}
              formatter={(value: any, name: any) => {
                const numValue = Number(value);
                if (name === "Price") return [`₹${(numValue / 100000).toFixed(2)} Lacs`, "Price"];
                if (name === "Area") return [numValue, "Area (sqft)"];
                return [numValue, name];
              }}
            />
            <Scatter name="Properties" data={data.points} fill="var(--color-accent-teal)" opacity={0.6} />
            <Line data={data.line} dataKey="priceLine" stroke="var(--color-accent-gold)" strokeWidth={2} dot={false} activeDot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}



export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteors, setMeteors] = useState<number[]>([]);

  useEffect(() => {
    const meteorsArr = new Array(number || 20).fill(true).map(() => Math.floor(Math.random() * 100));
    setMeteors(meteorsArr);
  }, [number]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none w-full h-full z-0">
      {meteors.map((el, idx) => (
        <span
          key={"meteor" + idx}
          className={clsx(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: 0,
            left: Math.floor(Math.random() * (400 - -400) + -400) + "px",
            animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + "s",
            animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + "s",
          }}
        ></span>
      ))}
    </div>
  );
};



interface PriceDistribution {
  bins: number[];
  counts: number[];
}

interface DistributionChartProps {
  data: PriceDistribution;
}

export function DistributionChart({ data }: DistributionChartProps) {
  // Transform data for Recharts
  const chartData = data.bins.map((bin, i) => ({
    binLabel: `₹${(bin / 100000).toFixed(0)}L+`,
    count: data.counts[i]
  }));

  return (
    <BentoCard className="flex flex-col h-full min-h-[250px]">
      <h3 className="font-display text-xl font-semibold mb-4">Price Distribution</h3>
      <div className="flex-1 w-full h-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="binLabel" 
              tick={{ fill: '#8B92A5', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
              axisLine={false} 
              tickLine={false} 
              interval="preserveStartEnd"
            />
            <Tooltip 
              cursor={{ fill: 'rgba(42, 48, 64, 0.4)' }}
              contentStyle={{ backgroundColor: '#1A1E2A', borderColor: '#2A3040', borderRadius: '8px', color: '#F1EFE9' }}
              itemStyle={{ color: '#34C6B8', fontFamily: 'var(--font-mono)' }}
              formatter={(value: any) => [value, 'Properties']}
            />
            <Bar dataKey="count" fill="var(--color-accent-teal)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}



interface Location {
  city: string;
  avgPrice: number;
}

interface TopLocationsProps {
  mostExpensive: Location[];
  mostAffordable: Location[];
}

export function TopLocations({ mostExpensive, mostAffordable }: TopLocationsProps) {
  return (
    <BentoCard className="flex flex-col h-full min-h-[300px]">
      <h3 className="font-display text-xl font-semibold mb-4">Location Rankings</h3>
      
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center mb-3">
            <TrendingUp className="w-4 h-4 text-accent-gold mr-2" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">Most Expensive</h4>
          </div>
          <div className="space-y-2">
            {mostExpensive.slice(0, 3).map((loc, i) => (
              <div key={`exp-${loc.city}`} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="text-muted w-4">{i + 1}.</span>
                  <span className="text-primary">{loc.city}</span>
                </div>
                <span className="font-mono text-accent-gold">₹{(loc.avgPrice / 100000).toFixed(2)}L</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center mb-3">
            <TrendingDown className="w-4 h-4 text-accent-teal mr-2" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">Most Affordable</h4>
          </div>
          <div className="space-y-2">
            {mostAffordable.slice(0, 3).map((loc, i) => (
              <div key={`aff-${loc.city}`} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="text-muted w-4">{i + 1}.</span>
                  <span className="text-primary">{loc.city}</span>
                </div>
                <span className="font-mono text-accent-teal">₹{(loc.avgPrice / 100000).toFixed(2)}L</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}



interface PriceEstimatorProps {
  slope: number;
  intercept: number;
}

export function PriceEstimator({ slope, intercept }: PriceEstimatorProps) {
  const [area, setArea] = useState<number | "">("");

  const estimate = area ? (Number(area) * slope) + intercept : null;

  return (
    <BentoCard className="flex flex-col h-full min-h-[200px]">
      <div className="flex items-center mb-4">
        <Calculator className="w-5 h-5 text-accent-gold mr-2" />
        <h3 className="font-display text-xl font-semibold">Price Estimator</h3>
      </div>
      
      <p className="text-sm text-muted mb-4">
        Enter area in sqft to get a baseline market estimate.
      </p>

      <div className="flex flex-col space-y-4">
        <div className="relative">
          <input 
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value ? Number(e.target.value) : "")}
            placeholder="e.g. 1500"
            className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-primary font-mono focus:outline-none focus:border-accent-gold transition-colors"
          />
          <span className="absolute right-4 top-3 text-muted text-sm pointer-events-none">sqft</span>
        </div>

        <div className="flex flex-col items-center justify-center bg-background/50 rounded-lg p-4 border border-card-border/50">
          <span className="text-xs uppercase tracking-widest text-muted mb-1">Estimated Value</span>
          {estimate ? (
            <span className="font-mono text-2xl text-accent-gold">
              ₹{(estimate / 100000).toFixed(2)} Lacs
            </span>
          ) : (
            <span className="font-mono text-2xl text-muted">--</span>
          )}
        </div>
      </div>
    </BentoCard>
  );
}



interface PropertyTypeStat {
  type: string;
  avgPrice: number;
  count: number;
}

interface PropertyTypeChartProps {
  data: PropertyTypeStat[];
  selectedType: string | null;
}

// Shades of teal for the donut chart
const COLORS = ['#34C6B8', '#2AA499', '#20837A', '#16625B', '#0D413D'];

export function PropertyTypeChart({ data, selectedType }: PropertyTypeChartProps) {
  return (
    <BentoCard className="flex flex-col h-full min-h-[300px]">
      <h3 className="font-display text-xl font-semibold mb-4">Price by Property Type</h3>
      <div className="flex-1 w-full h-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="avgPrice"
              nameKey="type"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  opacity={selectedType && selectedType !== entry.type ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1A1E2A', borderColor: '#2A3040', borderRadius: '8px', color: '#F1EFE9' }}
              itemStyle={{ color: '#34C6B8', fontFamily: 'var(--font-mono)' }}
              formatter={(value: any) => [`₹${(Number(value) / 100000).toFixed(2)} Lacs`, 'Avg Price']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((entry, index) => (
          <div key={entry.type} className={`flex items-center text-xs transition-opacity ${selectedType && selectedType !== entry.type ? 'opacity-30' : 'opacity-100'}`}>
            <span 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-muted">{entry.type}</span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}




// Since it's a client component, we can just import the JSON directly

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const cities = data.cityStats.map(c => c.city);
  const propertyTypes = data.propertyTypeStats.map(t => t.type);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Real Estate Market Analysis</h1>
        <p className="text-muted text-sm max-w-2xl">
          Comprehensive spatial and temporal analysis of property markets across major cities.
        </p>
      </header>
      
      <FilterBar 
        cities={cities}
        propertyTypes={propertyTypes}
        selectedCity={selectedCity}
        selectedType={selectedType}
        onCityChange={setSelectedCity}
        onTypeChange={setSelectedType}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        <HeroSkyline cityStats={data.cityStats} summary={data.summary} />
        
        <div className="col-span-1">
          <CityCompareChart data={data.cityStats} selectedCity={selectedCity} />
        </div>
        
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <PropertyTypeChart data={data.propertyTypeStats} selectedType={selectedType} />
        </div>
        
        <TrendChart yearlyTrend={data.yearlyTrend} yearlyTrendByCity={data.yearlyTrendByCity} selectedCity={selectedCity} />
        
        <div className="col-span-1">
          <DistributionChart data={data.priceDistribution} />
        </div>
        
        <div className="col-span-1">
          <ScatterCorrelation 
            slope={data.regression.slope} 
            intercept={data.regression.intercept} 
            correlation={data.correlation.areaVsPrice} 
          />
        </div>
        
        <div className="col-span-1">
          <TopLocations 
            mostExpensive={data.topLocations.mostExpensive} 
            mostAffordable={data.topLocations.mostAffordable} 
          />
        </div>
        
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <PriceEstimator slope={data.regression.slope} intercept={data.regression.intercept} />
        </div>
      </div>
      
      <footer className="mt-12 mb-6 pt-6 border-t border-card-border text-center text-sm text-muted">
        Part 2 — Skyline Bento Dashboard
      </footer>
    </main>
  );
}
