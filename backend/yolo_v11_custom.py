from ultralytics import YOLO
import cv2

model = YOLO("pokemodel.pt")

results = model.predict(source=2, show=True, conf=0.4, save=True)