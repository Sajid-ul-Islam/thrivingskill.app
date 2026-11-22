import os
import zipfile

def package_plugin():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    plugin_dir = os.path.join(base_dir, 'backend-plugin', 'thriving-skills-mobile-bridge')
    output_zip = os.path.join(base_dir, 'backend-plugin', 'thriving-skills-mobile-bridge.zip')
    
    print(f"📦 Packaging WordPress Plugin from {plugin_dir}...")
    
    if os.path.exists(output_zip):
        os.remove(output_zip)
        
    parent_dir = os.path.dirname(plugin_dir)
    
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(plugin_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, parent_dir)
                # CRITICAL: Always use POSIX forward slashes ('/') in ZIP archives
                # Windows backslashes ('\') cause "Plugin file does not exist" on Linux WordPress servers!
                posix_arcname = rel_path.replace('\\', '/')
                zipf.write(full_path, posix_arcname)
                print(f"  + Added: {posix_arcname}")
                
    size_kb = os.path.getsize(output_zip) / 1024
    print(f"✅ Successfully created Linux/Unix-compatible zip: {output_zip} ({size_kb:.2f} KB)")

if __name__ == '__main__':
    package_plugin()
