#!/usr/bin/env python3
import sys
import json
import os
import pandas as pd
import numpy as np
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.modules.data.mocap_data.prediction.assign_ed_labels import main as main_ED
from src.modules.data.mocap_data.visualize_reference_data import process_file




def main():
    # sys.argv[0] is the script name.
    # sys.argv[1] -> model (e.g., "model1")
    # sys.argv[2] -> dataType ("mocap" or "video")
    # sys.argv[3] -> filesArg (comma-separated file names)
    # sys.argv[4] -> visualize ("true" or "false")
    if len(sys.argv) < 5:
        print(json.dumps({"error": "Insufficient arguments"}))
        sys.exit(1)
    
    print("Starting prediction process...", file=sys.stderr, flush=True)


    
    model = sys.argv[1]
    data_type = sys.argv[2]
    files_arg = sys.argv[3]
    visualize = (sys.argv[4].lower() == 'true')
    files_list = files_arg.split(',')
    
    # For debugging, you can print to stderr:
    print(f"[DEBUG] Model: {model}, DataType: {data_type}, Visualize: {visualize}", file=sys.stderr)
    
    predictions = {}
    for file in files_list:
        # For demonstration, assume each file is a CSV in a known directory.
        # Adjust the base path accordingly.
        if data_type == 'mocap':
            file_path = os.path.join('/home/oline/SL_Automatic_Phonetic_Annotation/src/server/public/data/mocap/corp/', file)
        else:
            file_path = os.path.join('/home/oline/SL_Automatic_Phonetic_Annotation/src/server/public/data/video', file)
        

        labels, data = main_ED(file_path)
        
        # If visualize is true, simulate a path to a generated GIF.
        if visualize:
            frames_dir = "/home/oline/SL_Automatic_Phonetic_Annotation/src/server/public/graphics/mocap_frames"
            gif_dir = "/home/oline/SL_Automatic_Phonetic_Annotation/src/server/public/graphics/mocap_gifs"
            frames_to_skip = 2
            fps = 15
            process_file(file_path, frames_dir, gif_dir, frames_to_skip, fps, skip_file = False, labels = labels, data = data)
            print("Visualization completed")

    
    result = {
        "model": model,
        "dataType": data_type,
        "visualize": visualize,
        "files": files_list,
        "predictions": predictions
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()
