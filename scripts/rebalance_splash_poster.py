import os
from PIL import Image, ImageFilter
import numpy as np

def generate_perfect_splash_poster():
    orig_path = 'assets/splash-poster.jpg'
    
    orig = Image.open(orig_path).convert('RGB')
    w, orig_h = orig.size
    print(f"Original size: {w}x{orig_h}")
    arr = np.array(orig)
    
    # Target height: 1240 (standard modern smartphone 19.5:9 ratio for w=572)
    new_h = 1240
    
    # 1. Clean background sample from row 945 (where no text exists in original)
    clean_row = arr[945:955, :, :].mean(axis=0).astype(float) # shape: (w, 3)
    
    # Table edge row at y=555
    table_edge = arr[555:565, :, :].mean(axis=0).astype(float) # shape: (w, 3)
    
    # 2. Build new base canvas
    new_arr = np.zeros((new_h, w, 3), dtype=np.uint8)
    
    # Top section: from 0 to 555 is 100% identical to original (people, laptop, table)
    new_arr[0:555, :, :] = arr[0:555, :, :]
    
    # Transition from table edge (y=555) to clean navy gradient (y=610)
    for y in range(555, 610):
        t = (y - 555) / 55.0
        # Smooth cosine interpolation
        t_smooth = 0.5 - 0.5 * np.cos(t * np.pi)
        row_c = (1.0 - t_smooth) * table_edge + t_smooth * clean_row
        new_arr[y, :, :] = np.clip(row_c, 0, 255).astype(np.uint8)
        
    # Lower navy field from y=610 to new_h (1240)
    # Add a very subtle deep navy vertical gradient towards the very bottom (authentic lighting)
    for y in range(610, new_h):
        # Progressively deepen towards the bottom
        progress = (y - 610) / float(new_h - 610)
        # Deepening factor: slightly deeper navy at the very bottom
        factor = 1.0 - progress * 0.12
        row_c = clean_row * factor
        new_arr[y, :, :] = np.clip(row_c, 0, 255).astype(np.uint8)
        
    base_plate = Image.fromarray(new_arr)
    
    # 3. Extract and cleanly blend each text/icon component:
    # Exact bounding boxes from original:
    # - "EMPOWERING PEOPLE": y=630 to 728
    # - "BUILDING A SKILLED NATION": y=740 to 763
    # - Row 1 (Expert-led / Practical): y=800 to 846
    # - Row 2 (Career / Learn): y=875 to 922
    
    def extract_and_blend(src_y1, src_y2, dest_y):
        crop = orig.crop((0, src_y1, w, src_y2))
        crop_arr = np.array(crop).astype(float)
        h_crop = src_y2 - src_y1
        
        # Original background under this crop was clean_row
        # Extract foreground luminance mask
        # Text/icons are bright (white/light blue)
        # Background is dark navy (~[1, 40, 85] to [1, 52, 118])
        bg = clean_row.astype(float)
        
        # Color difference from background
        diff = np.maximum.reduce([
            crop_arr[:, :, 0] - bg[None, :, 0],
            crop_arr[:, :, 1] - bg[None, :, 1],
            crop_arr[:, :, 2] - bg[None, :, 2]
        ])
        
        # Smooth alpha mask
        mask = np.clip((diff - 12.0) / 40.0, 0.0, 1.0)
        
        # Target background under destination
        target_crop = np.array(base_plate.crop((0, dest_y, w, dest_y + h_crop))).astype(float)
        
        # Alpha composite
        blended = target_crop * (1.0 - mask[:, :, None]) + crop_arr * mask[:, :, None]
        base_plate.paste(Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8)), (0, dest_y))
        print(f"Placed element {src_y1}-{src_y2} at dest_y={dest_y} to {dest_y + h_crop}")

    # Elevate headline:
    # In original: y=630 to 728 (height 98) -> new dest_y = 560 (ends at 658)
    extract_and_blend(630, 728, 560)
    
    # Subtitle:
    # In original: y=740 to 763 (height 23) -> new dest_y = 668 (ends at 691)
    extract_and_blend(740, 763, 668)
    
    # Row 1 icons:
    # In original: y=800 to 846 (height 46) -> new dest_y = 718 (ends at 764)
    extract_and_blend(800, 846, 718)
    
    # Row 2 icons:
    # In original: y=875 to 922 (height 47) -> new dest_y = 780 (ends at 827)
    extract_and_blend(875, 922, 780)
    
    # NOTE: The static 'www.thrivingskill.com' at y=975 is intentionally NOT copied.
    # This leaves from y=827 to y=1240 (413 PIXELS!) of pure, unobstructed deep navy background.
    
    # Save optimized image
    base_plate.save('assets/splash-poster.jpg', quality=95, optimize=True)
    base_plate.save('assets/splash-hero.jpg', quality=95, optimize=True)
    print("Successfully generated and updated assets/splash-poster.jpg (572x1240)")

if __name__ == '__main__':
    generate_perfect_splash_poster()
