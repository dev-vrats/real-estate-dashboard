import pandas as pd
import numpy as np

def create_dataset():
    print("Starting data generation...")
    
    num_rows = 800
    
    city_list = ["Lucknow", "Delhi", "Mumbai", "Bengaluru", "Pune", "Hyderabad"]
    type_list = ["Apartment", "Villa", "Independent House", "Plot", "Studio"]
    
    # City price factors relative to a base
    city_factors = {
        "Mumbai": 2.5,
        "Delhi": 2.0,
        "Bengaluru": 1.8,
        "Pune": 1.4,
        "Hyderabad": 1.3,
        "Lucknow": 0.8
    }
    
    # Property type factors
    type_factors = {
        "Villa": 2.0,
        "Independent House": 1.5,
        "Apartment": 1.0,
        "Studio": 0.7,
        "Plot": 0.5
    }
    
    cities = []
    types = []
    areas = []
    beds = []
    prices = []
    years = []
    
    for i in range(num_rows):
        city = np.random.choice(city_list)
        prop_type = np.random.choice(type_list)
        
        # generate realistic area based on type
        if prop_type == "Studio":
            area = np.random.randint(300, 600)
            bed = 1
        elif prop_type == "Apartment":
            area = np.random.randint(600, 2000)
            bed = np.random.randint(1, 4)
        elif prop_type == "Villa":
            area = np.random.randint(2000, 5000)
            bed = np.random.randint(3, 6)
        elif prop_type == "Independent House":
            area = np.random.randint(1000, 3000)
            bed = np.random.randint(2, 5)
        else: # Plot
            area = np.random.randint(1000, 5000)
            bed = 0 # No bedrooms for plot
            
        # calculate base price
        base_rate = 5000 # 5000 per sqft as base
        calculated_price = area * base_rate * city_factors[city] * type_factors[prop_type]
        
        # add some random noise so it looks real
        noise = np.random.normal(0, calculated_price * 0.1) # 10% noise
        final_price = int(calculated_price + noise)
        
        # random year between 2021 and 2025
        year = np.random.randint(2021, 2026)
        
        # slight inflation for newer years
        year_factor = 1 + (year - 2021) * 0.05
        final_price = int(final_price * year_factor)
        
        cities.append(city)
        types.append(prop_type)
        areas.append(area)
        beds.append(bed)
        prices.append(final_price)
        years.append(year)
        
    print("Finished generating rows.")
    
    # create pandas dataframe to save as csv
    df = pd.DataFrame({
        "city": cities,
        "property_type": types,
        "area_sqft": areas,
        "bedrooms": beds,
        "price": prices,
        "year_listed": years
    })
    
    df.to_csv("realestate_data.csv", index=False)
    print("Dataset saved to realestate_data.csv successfully!")

if __name__ == "__main__":
    create_dataset()
