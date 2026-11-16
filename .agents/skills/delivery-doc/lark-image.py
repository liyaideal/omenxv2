#!/usr/bin/env python3
"""Fill an empty Lark docx image block with a local image.

usage: lark-image.py <doc_id> <image_block_id> <local_image_path>

Run on Liya's Mac (device_bash). Reads the user token the Lark CLI keeps in
~/mnt/.lark/tokens.json (run any `lark doc …` command first so it is fresh).
Never print the token.
"""
import json, os, subprocess, sys

doc, block, path = sys.argv[1:4]
tok = json.load(open(os.path.expanduser("~/mnt/.lark/tokens.json")))["access_token"]
auth = "Authorization: Bearer " + tok
base = "https://open.larksuite.com/open-apis"

r = subprocess.run(
    ["curl", "-sS", "-X", "POST", base + "/drive/v1/medias/upload_all", "-H", auth,
     "-F", "file_name=" + os.path.basename(path), "-F", "parent_type=docx_image",
     "-F", "parent_node=" + block, "-F", "size=" + str(os.path.getsize(path)),
     "-F", "extra=" + json.dumps({"drive_route_token": doc}), "-F", "file=@" + path],
    capture_output=True, text=True)
j = json.loads(r.stdout)
if j.get("code") != 0:
    print("upload fail", j.get("code"), j.get("msg")); sys.exit(1)

r = subprocess.run(
    ["curl", "-sS", "-X", "PATCH", base + f"/docx/v1/documents/{doc}/blocks/{block}", "-H", auth,
     "-H", "Content-Type: application/json", "-d", json.dumps({"replace_image": {"token": j["data"]["file_token"]}})],
    capture_output=True, text=True)
j = json.loads(r.stdout)
if j.get("code") != 0:
    print("patch fail", j.get("code"), j.get("msg")); sys.exit(1)
print("ok")
