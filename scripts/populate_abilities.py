import csv
import os
import json
from pathlib import Path
file = "data.csv"

def get_cat_name(c):
    name = c.lower() + "s.db"
    scripts_path = Path(__file__).parent.absolute()
    filepath = os.path.join(scripts_path, name)
    return filepath

def parse_affinity(a):
    # todo: parsing
    return {"blue":0,"green":0,"white":0,"black":0,"red":0}

def create_dict(category, name, desc, rules_text, cp_cost, affinity):
    d = {}
    d["category"] = category
    d["ability_name"] = name
    d["ability_description"] = desc
    d["rules"] = rules_text
    d["cp"] = cp_cost
    d["affinity"] = {"red":affinity["red"], "green":affinity["green"], "blue":affinity["blue"], "black":affinity["black"], "white":affinity["white"]}
    return d

def generate_db_line(line):
    a,b,c,d,e,f,g = [line[i] for i in range(7)]
    category = b
    cp_cost = f
    affinity_req = parse_affinity(g)
    db = create_dict(category, c, d, e, cp_cost, affinity_req)
    return db

def write_out_files(categories):
    for k in categories.keys():
        db_file = get_cat_name(k)
        with open(db_file, "w") as f:
            json.dump(categories[k], f)

if __name__ == "__main__":
    
    categories = {
        "aura" : {},
        "buff" : {},
        "passive" : {},
        "ritual" : {},
        "metamagic" : {},
        "spell" : {},
        "maneuver" : {}
    }
    
    with open(file, "r") as f:
        lines = csv.reader(f)
        for line in lines:
            category = line[1]
            db = generate_db_line(line)
            if category.lower() in categories.keys():
                print(f'{db}')
                categories[category.lower()][line[2]] = db
    
    write_out_files(categories)
