import numpy as np 

class EuclideanModel:
    """ 
    A class to calculate the Euclidean distance between a pose and a reference pose.
    """
    def __init__(self, reference_poses, reference_labels):
        """
        Initializes the EuclideanModel with reference poses and their corresponding labels.

        Parameters:
        - reference_poses: A NumPy array of shape (M, 14, 3), where M is the number of reference handshapes.
        - reference_labels: A list of M labels corresponding to the reference poses.
        """
        self.reference_poses = np.array(reference_poses)  # (M, 14, 3)
        self.reference_labels = reference_labels  # List of M labels
        print(len(self.reference_poses))
        print(len(self.reference_labels))
        
        
    def calculate_euclidean_distance(self, pose):
        """
        Calculates the Euclidean distance between a given pose and all reference poses.

        Parameters:
        - pose: A NumPy array of shape (14, 3), representing a single frame.

        Returns:
        - A NumPy array of shape (M,), containing distances to each reference pose.
        """
        distances = np.linalg.norm(self.reference_poses - pose, axis=(1, 2))  # (M,)
        return distances

    def classify_pose_sequence(self, pose_sequence):
        """
        Classifies each frame in a pose sequence by finding the closest reference handshape.

        Parameters:
        - pose_sequence: A NumPy array of shape (T_frames, 14, 3), where T_frames is the number of frames.

        Returns:
        - A list of length T_frames with the predicted handshape labels.
        """
        predicted_labels = []
        
        for frame in pose_sequence:  # Iterate over frames (T_frames, 14, 3)
            distances = self.calculate_euclidean_distance(frame)  # (M,)
            
            closest_index = np.argmin(distances)  # Index of closest reference

            predicted_labels.append(self.reference_labels[closest_index])  # Get label

        return predicted_labels
