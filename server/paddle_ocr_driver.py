import sys
import json
from paddleocr import PaddleOCR


def extract_fields(text_lines):
    data = {"name": "", "dob": "", "trn": "", "nationality": ""}
    for line in text_lines:
        lower = line.lower()
        if "name" in lower and not data["name"]:
            data["name"] = line.split(":")[-1].strip()
        elif ("dob" in lower or "date of birth" in lower) and not data["dob"]:
            data["dob"] = line.split(":")[-1].strip()
        elif "trn" in lower and not data["trn"]:
            data["trn"] = line.split(":")[-1].strip()
        elif "nationality" in lower and not data["nationality"]:
            data["nationality"] = line.split(":")[-1].strip()
    return data


def main(path):
    ocr = PaddleOCR(use_angle_cls=True, lang="en")
    result = ocr.ocr(path, cls=True)
    lines = [res[1][0] for res in result[0]] if result else []
    data = extract_fields(lines)
    print(json.dumps(data))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
    main(sys.argv[1])
