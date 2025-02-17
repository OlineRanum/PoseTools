import json
import sys
import numpy as np
import pandas as pd
import os 
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.modules.data.mocap_data.utils.dataloader import DataLoader
from src.modules.data.mocap_data.utils.normalizer import Normalizer
from src.models.euclidean_model.euclideanModel import EuclideanModel

def load_references(file_path):
    """Load JSON file and stack all cluster centers into a single array."""
    
    data_dict = load_json(file_path)
    all_centers = []
    handshape_labels = []

    # Iterate through all keys (handshapes)
    for handshape, clusters in data_dict.items():
        if isinstance(clusters, list):  # Ensure data is structured as a list
            for i, entry in enumerate(clusters):
                if isinstance(entry, dict) and 'center' in entry:
                    all_centers.append(entry['center'])
                    hs_label = handshape.split("_marker")[0]
                    handshape_labels.append(f"{hs_label}")

    # Convert to NumPy array
    if all_centers:
        centers_arr = np.array(all_centers)
        print("Stacked array shape:", centers_arr.shape, flush=True, file=sys.stderr)

        handshape_labels = np.array(handshape_labels)
        print("Handshape labels shape:", handshape_labels.shape, flush=True, file=sys.stderr)
        
        reference_pose = np.mean(centers_arr, axis=0)  # (14, 3)
        
        reference_file = "/home/oline/SL_Automatic_Phonetic_Annotation/src/server/public/output/reference_hand.json"
        with open(reference_file, "w") as f:
            json.dump({"reference_pose": reference_pose.tolist()}, f)

        return centers_arr, handshape_labels, reference_pose
    else:
        print("No valid cluster centers found.", flush=True, file=sys.stderr)
        return None, None

def load_json(file_path):
    """Load JSON file and return as a dictionary."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_csv(file_path, drop_col = True):
    loader = DataLoader(file_path, mode='hand')
                
    normalizer = Normalizer(loader)

    # Load and preprocess data
    loader.load_data()
    normalizer.load_transformations()
    right_hand, marker_names_hands = loader.get_hand()
    normalized_right_handshape = normalizer.normalize_handshape(right_hand, marker_names_hands)
    #hand_edges = loader.prepare_hand_data()
    
    valid_frames = ~np.isnan(normalized_right_handshape).any(axis=(1, 2))
    normalized_right_handshape = normalized_right_handshape[valid_frames]
    # Keep only valid frames
    return normalized_right_handshape # [::100]
    
def predict(data, reference_poses, reference_labels):
    # Initialize model
    model = EuclideanModel(reference_poses, reference_labels)

    # Classify the pose sequence
    predicted_labels = model.classify_pose_sequence(data)
    return predicted_labels

def main(data_file):
    # Load reference handshapes
    file_path = "/home/oline/SL_Automatic_Phonetic_Annotation/src/server/public/output/mocap_clusters.json"
    references, ref_labels, reference_pose = load_references(file_path)

    data = load_csv(data_file)
    print("Data: ", data.shape, flush=True, file=sys.stderr)


    predicted_labels = predict(data, references, ref_labels)
    print("Predicted labels: ", len(predicted_labels), flush=True, file=sys.stderr)
    return predicted_labels, data 


if __name__ == "__main__":
    csv = '/home/oline/SL_Automatic_Phonetic_Annotation/src/server/public/data/mocap/corp/ALIEN_250212_0_MarkerData.csv'
    main(csv)
