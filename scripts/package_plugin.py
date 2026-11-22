import os
import zipfile
import time

def package_plugin():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    plugin_dir = os.path.join(base_dir, 'backend-plugin', 'thriving-skills-mobile-bridge')
    output_zip = os.path.join(base_dir, 'backend-plugin', 'thriving-skills-mobile-bridge.zip')
    
    print(f"📦 Packaging WordPress Plugin from {plugin_dir}...")

    # Remove old zip if present
    if os.path.exists(output_zip):
        os.remove(output_zip)
        
    parent_dir = os.path.dirname(plugin_dir)
    folder_name = os.path.basename(plugin_dir)
    
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Create explicit folder entry with 0o755 permissions for Linux/WordPress unzippers
        now = time.localtime(time.time())[:6]
        dir_info = zipfile.ZipInfo(f"{folder_name}/", date_time=now)
        dir_info.external_attr = 0o755 << 16
        dir_info.external_attr |= 0x10  # Directory flag
        zipf.writestr(dir_info, '')
        print(f"  + Added directory entry: {folder_name}/")

        for root, dirs, files in os.walk(plugin_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, parent_dir)
                posix_arcname = rel_path.replace('\\', '/')
                
                # File entry with 0o644 permissions
                with open(full_path, 'rb') as f:
                    file_bytes = f.read()
                file_info = zipfile.ZipInfo(posix_arcname, date_time=now)
                file_info.external_attr = 0o644 << 16
                file_info.compress_type = zipfile.ZIP_DEFLATED
                zipf.writestr(file_info, file_bytes)
                print(f"  + Added file entry: {posix_arcname}")
                
    size_kb = os.path.getsize(output_zip) / 1024
    print(f"✅ Successfully created Linux/Unix-compatible zip: {output_zip} ({size_kb:.2f} KB)")

if __name__ == '__main__':
    package_plugin()
