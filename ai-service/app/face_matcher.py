import logging
import face_recognition
import numpy as np
import requests
import os
import cv2

logger = logging.getLogger(__name__)

class FaceMatcher:
    def __init__(self):
        # Maps caseId -> face_encoding
        self.active_cases = {}
        # Base URL for fetching uploaded reference images from the Node backend
        self.backend_url = os.environ.get('NODE_BACKEND_URL', 'http://localhost:5000')

    def load_case(self, case_id, reference_image_path):
        """
        Downloads/loads the reference image and computes its encoding.
        """
        try:
            # If the path is relative to the uploads folder, fetch it via HTTP
            if reference_image_path.startswith('/uploads/'):
                image_url = f"{self.backend_url}{reference_image_path}"
                logger.info(f"Downloading reference image for case {case_id} from {image_url}")
                response = requests.get(image_url)
                if response.status_code == 200:
                    image_array = np.asarray(bytearray(response.content), dtype="uint8")
                    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                    # Convert BGR (OpenCV) to RGB (face_recognition)
                    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                else:
                    logger.error(f"Failed to download reference image. Status: {response.status_code}")
                    return
            else:
                logger.error(f"Unsupported image path format: {reference_image_path}")
                return

            encodings = face_recognition.face_encodings(image)
            if len(encodings) > 0:
                self.active_cases[case_id] = encodings[0]
                logger.info(f"Successfully loaded face encoding for case {case_id}")
            else:
                logger.warning(f"No face detected in reference image for case {case_id}")
                
        except Exception as e:
            logger.error(f"Error loading case {case_id}: {str(e)}")

    def unload_case(self, case_id):
        if case_id in self.active_cases:
            del self.active_cases[case_id]
            logger.info(f"Unloaded face encoding for case {case_id}")

    def detect_faces(self, frame):
        """
        Takes a BGR OpenCV frame, finds faces, and compares them against active cases.
        Returns a list of matching caseIds.
        """
        if not self.active_cases:
            return [] # Skip processing if no active cases (saves CPU)

        try:
            # Convert frame from BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Find face locations and encodings in the current frame
            # For speed, you could use 'hog' model instead of 'cnn' and shrink the frame
            small_frame = cv2.resize(rgb_frame, (0, 0), fx=0.5, fy=0.5)
            
            face_locations = face_recognition.face_locations(small_frame)
            face_encodings = face_recognition.face_encodings(small_frame, face_locations)

            matches_found = []

            for face_encoding in face_encodings:
                for case_id, reference_encoding in self.active_cases.items():
                    # Compare faces (tolerance 0.6 is default, lower is stricter)
                    match = face_recognition.compare_faces([reference_encoding], face_encoding, tolerance=0.55)[0]
                    if match:
                        matches_found.append(case_id)
            
            # Deduplicate just in case
            return list(set(matches_found))

        except Exception as e:
            logger.error(f"Error during face matching: {str(e)}")
            return []
