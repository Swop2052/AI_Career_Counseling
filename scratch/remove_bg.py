from PIL import Image

def remove_background(image_path, output_path, tolerance=30):
    img = Image.open(image_path).convert("RGBA")
    data = img.getdata()
    
    # Get the background color from the top-left pixel
    bg_color = data[0]
    bg_r, bg_g, bg_b = bg_color[:3]
    
    new_data = []
    for item in data:
        r, g, b, a = item
        # If pixel is close to background color, make it transparent
        if (abs(r - bg_r) <= tolerance and
            abs(g - bg_g) <= tolerance and
            abs(b - bg_b) <= tolerance):
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print("Background removed successfully!")

remove_background("static/logo.png", "static/logo.png")
