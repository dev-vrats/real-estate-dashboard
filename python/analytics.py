"""
analytics.py
Data analysis + chart-generating functions for the Real Estate Market Analytics app.

"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
import os

def plot_price_distribution(data):
    fig, ax = plt.subplots(figsize=(8, 4))
    price_col = 'Price_in_Lakhs' if 'Price_in_Lakhs' in data.columns else 'price'
    if price_col in data.columns:
        sns.histplot(data[price_col], bins=30, ax=ax, color='steelblue')
        ax.set_title("Price Distribution")
        plt.savefig("output/price_distribution.png")
    plt.close()


def plot_property_type_mix(data):
    prop_col = 'Property_Type' if 'Property_Type' in data.columns else 'property_type'
    if prop_col in data.columns:
        fig, ax = plt.subplots(figsize=(8, 4))
        data[prop_col].value_counts().plot(kind='bar', ax=ax, color='coral')
        ax.set_title("Property Type Mix")
        ax.set_ylabel("Count")
        plt.savefig("output/property_mix.png")
        plt.close()


def plot_type_by_state(data):
    if 'State' in data.columns and ('Property_Type' in data.columns or 'property_type' in data.columns):
        prop_col = 'Property_Type' if 'Property_Type' in data.columns else 'property_type'
        type_by_state = pd.crosstab(data['State'], data[prop_col])
        fig, ax = plt.subplots(figsize=(14, 6))
        type_by_state.plot(kind='bar', stacked=True, ax=ax)
        ax.set_title("Property Type Distribution by State")
        ax.set_ylabel("Number of Properties")
        ax.grid(axis='y')
        plt.savefig("output/type_by_state.png")
        plt.close()


def plot_furnished_status(data):
    if 'Furnished_Status' in data.columns:
        fig, ax = plt.subplots(figsize=(5, 5))
        counts = data['Furnished_Status'].value_counts()
        ax.pie(counts, labels=counts.index, autopct='%1.1f%%', startangle=90)
        ax.set_title("Furnished Status Distribution")
        plt.savefig("output/furnished_status.png")
        plt.close()


def plot_amenities(data):
    if 'Amenities' in data.columns:
        amenities_split = data['Amenities'].str.split(', ')
        all_amenities = amenities_split.explode()
        amenity_counts = all_amenities.value_counts()

        fig, ax = plt.subplots(figsize=(8, 4))
        amenity_counts.plot(kind='bar', ax=ax, color='seagreen')
        ax.set_title("Amenities Frequency")
        ax.set_ylabel("Count")
        plt.savefig("output/amenities.png")
        plt.close()


def plot_correlation_heatmap(data):
    numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) > 1:
        corr = data[numeric_cols].corr()
        fig, ax = plt.subplots(figsize=(8, 6))
        sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', center=0,
                    square=True, linewidths=0.5, ax=ax)
        ax.set_title("Correlation Heatmap")
        plt.savefig("output/correlation.png")
        plt.close()


def generate_nextjs_data(df):
    print("Generating data for Next.js dashboard...")
    
    # Map headers for standard processing if they exist
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
        
    # Ensure fallback columns exist
    if "price" not in df.columns: df["price"] = 0
    if "city" not in df.columns: df["city"] = "Unknown"
    if "property_type" not in df.columns: df["property_type"] = "Unknown"
    if "year_listed" not in df.columns: df["year_listed"] = 2024
    if "area_sqft" not in df.columns: df["area_sqft"] = 0
    
    total_properties = len(df)
    avg_price = int(np.mean(df["price"])) if len(df) > 0 else 0
    
    city_groups = df.groupby("city")
    city_stats = []
    for city, group in city_groups:
        city_stats.append({"city": city, "avgPrice": int(np.mean(group["price"])), "medianPrice": int(np.median(group["price"])), "count": len(group)})
        
    type_groups = df.groupby("property_type")
    type_stats = []
    for ptype, group in type_groups:
        type_stats.append({"type": ptype, "avgPrice": int(np.mean(group["price"])), "count": len(group)})
        
    year_groups = df.groupby("year_listed")
    yearly_trend = []
    for year, group in year_groups:
        yearly_trend.append({"year": int(year), "avgPrice": int(np.mean(group["price"]))})
        
    yearly_city_trend = []
    year_city_groups = df.groupby(["year_listed", "city"])
    for (year, city), group in year_city_groups:
        yearly_city_trend.append({"year": int(year), "city": city, "avgPrice": int(np.mean(group["price"]))})
        
    counts, bins = np.histogram(df["price"], bins=10)
    price_dist = {"bins": [int(b) for b in bins[:-1]], "counts": [int(c) for c in counts]}
    
    # Regression safely
    correlation = 0
    m, c = 0, 0
    if df["area_sqft"].std() > 0 and df["price"].std() > 0:
        corr_matrix = np.corrcoef(df["area_sqft"].values, df["price"].values)
        correlation = round(corr_matrix[0, 1], 2)
        m, c = np.polyfit(df["area_sqft"].values, df["price"].values, 1)
    
    sorted_cities = sorted(city_stats, key=lambda x: x["avgPrice"], reverse=True)
    most_exp = sorted_cities[0]["city"] if sorted_cities else "Unknown"
    most_aff = sorted_cities[-1]["city"] if sorted_cities else "Unknown"
    
    top_locations = {
        "mostExpensive": [{"city": c["city"], "avgPrice": c["avgPrice"]} for c in sorted_cities[:5]],
        "mostAffordable": [{"city": c["city"], "avgPrice": c["avgPrice"]} for c in sorted_cities[::-1][:5]]
    }
    
    final_data = {
        "summary": {
            "totalProperties": total_properties,
            "avgPrice": avg_price,
            "mostExpensiveCity": most_exp,
            "mostAffordableCity": most_aff
        },
        "cityStats": city_stats,
        "propertyTypeStats": type_stats,
        "yearlyTrend": yearly_trend,
        "yearlyTrendByCity": yearly_city_trend,
        "priceDistribution": price_dist,
        "correlation": {"areaVsPrice": float(correlation)},
        "regression": {"slope": float(m), "intercept": float(c)},
        "topLocations": top_locations
    }
    
    with open("../web/app/data.json", "w") as f:
        json.dump(final_data, f, indent=4)
    print("data.json exported successfully to web/app/data.json!")


if __name__ == "__main__":
    if not os.path.exists("output"):
        os.makedirs("output")
        
    df = pd.read_csv("realestate_data.csv")
    
    print("Generating charts...")
    plot_price_distribution(df)
    plot_property_type_mix(df)
    plot_type_by_state(df)
    plot_furnished_status(df)
    plot_amenities(df)
    plot_correlation_heatmap(df)
    
    generate_nextjs_data(df)
