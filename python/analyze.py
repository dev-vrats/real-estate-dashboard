import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json
import os

def analyze_data():
    print("Loading data...")
    df = pd.read_csv("realestate_data.csv")
    
    # Map new headers to the expected headers for compatibility
    if "Price_in_Lakhs" in df.columns:
        df["price"] = df["Price_in_Lakhs"] * 100000
    if "City" in df.columns:
        df["city"] = df["City"]
    if "Property_Type" in df.columns:
        df["property_type"] = df["Property_Type"]
    if "Year_Built" in df.columns:
        df["year_listed"] = df["Year_Built"]
    if "Size_in_SqFt" in df.columns:
        df["area_sqft"] = df["Size_in_SqFt"]
        
    # create output folder if not exist
    if not os.path.exists("output"):
        os.makedirs("output")
        
    print("Calculating overall statistics...")
    total_properties = len(df)
    avg_price = int(np.mean(df["price"]))
    
    print("Calculating city stats...")
    city_groups = df.groupby("city")
    city_stats = []
    
    for city, group in city_groups:
        c_avg = int(np.mean(group["price"]))
        c_med = int(np.median(group["price"]))
        c_count = len(group)
        city_stats.append({"city": city, "avgPrice": c_avg, "medianPrice": c_med, "count": c_count})
        
    print("Calculating property type stats...")
    type_groups = df.groupby("property_type")
    type_stats = []
    
    for ptype, group in type_groups:
        t_avg = int(np.mean(group["price"]))
        t_count = len(group)
        type_stats.append({"type": ptype, "avgPrice": t_avg, "count": t_count})
        
    print("Calculating yearly trends...")
    year_groups = df.groupby("year_listed")
    yearly_trend = []
    for year, group in year_groups:
        yearly_trend.append({"year": int(year), "avgPrice": int(np.mean(group["price"]))})
        
    yearly_city_trend = []
    year_city_groups = df.groupby(["year_listed", "city"])
    for (year, city), group in year_city_groups:
        yearly_city_trend.append({"year": int(year), "city": city, "avgPrice": int(np.mean(group["price"]))})
        
    print("Generating price distribution...")
    # Using np.histogram to get bins and counts
    counts, bins = np.histogram(df["price"], bins=10)
    # Convert numpy types to python int/float for json serialization
    price_dist = {
        "bins": [int(b) for b in bins[:-1]], 
        "counts": [int(c) for c in counts]
    }
    
    print("Calculating correlation and regression...")
    area_array = df["area_sqft"].values
    price_array = df["price"].values
    
    corr_matrix = np.corrcoef(area_array, price_array)
    correlation = round(corr_matrix[0, 1], 2)
    
    # Simple linear regression: y = mx + c
    m, c = np.polyfit(area_array, price_array, 1)
    
    # Sort cities to find most expensive and affordable
    sorted_cities = sorted(city_stats, key=lambda x: x["avgPrice"], reverse=True)
    most_expensive = sorted_cities[0]["city"]
    most_affordable = sorted_cities[-1]["city"]
    
    top_locations = {
        "mostExpensive": [{"city": c["city"], "avgPrice": c["avgPrice"]} for c in sorted_cities[:5]],
        "mostAffordable": [{"city": c["city"], "avgPrice": c["avgPrice"]} for c in sorted_cities[::-1][:5]]
    }
    
    print("Creating charts for the assignment...")
    
    # Chart 1: Average Price by City
    cities_for_chart = [c["city"] for c in city_stats]
    prices_for_chart = [c["avgPrice"] for c in city_stats]
    
    plt.figure(figsize=(10, 6))
    plt.bar(cities_for_chart, prices_for_chart, color="skyblue")
    plt.title("Average Property Price by City")
    plt.xlabel("City")
    plt.ylabel("Average Price (INR)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig("output/city_prices.png")
    plt.close()
    
    # Chart 2: Price Distribution
    plt.figure(figsize=(10, 6))
    plt.hist(df["price"], bins=20, color="lightgreen", edgecolor="black")
    plt.title("Distribution of Property Prices")
    plt.xlabel("Price (INR)")
    plt.ylabel("Number of Properties")
    plt.tight_layout()
    plt.savefig("output/price_distribution.png")
    plt.close()
    
    print("Exporting data.json...")
    
    final_data = {
        "summary": {
            "totalProperties": total_properties,
            "avgPrice": avg_price,
            "mostExpensiveCity": most_expensive,
            "mostAffordableCity": most_affordable
        },
        "cityStats": city_stats,
        "propertyTypeStats": type_stats,
        "yearlyTrend": yearly_trend,
        "yearlyTrendByCity": yearly_city_trend,
        "priceDistribution": price_dist,
        "correlation": {
            "areaVsPrice": float(correlation)
        },
        "regression": {
            "slope": float(m),
            "intercept": float(c)
        },
        "topLocations": top_locations
    }
    
    with open("data.json", "w") as f:
        json.dump(final_data, f, indent=4)
        
    print("Analysis complete! All files saved successfully.")

if __name__ == "__main__":
    analyze_data()
