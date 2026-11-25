import os
import time
import zipfile


def package_plugin():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    plugin_dir = os.path.join(base_dir, 'backend-plugin', 'ts-mobile-bridge')
    output_zip = os.path.join(base_dir, 'backend-plugin', 'ts-mobile-bridge.zip')

    if not os.path.isdir(plugin_dir):
        raise FileNotFoundError(f"Plugin source directory not found: {plugin_dir}")

    print(f"Packaging WordPress Plugin from {plugin_dir}...")

    if os.path.exists(output_zip):
        os.remove(output_zip)

    parent_dir = os.path.dirname(plugin_dir)
    folder_name = os.path.basename(plugin_dir)

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        now = time.localtime(time.time())[:6]
        dir_info = zipfile.ZipInfo(f"{folder_name}/", date_time=now)
        dir_info.external_attr = (0o755 << 16) | 0x10
        zipf.writestr(dir_info, '')

        for root, _dirs, files in os.walk(plugin_dir):
            for file in sorted(files):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, parent_dir)
                posix_arcname = rel_path.replace('\\', '/')

                with open(full_path, 'rb') as f:
                    file_bytes = f.read()
                file_info = zipfile.ZipInfo(posix_arcname, date_time=now)
                file_info.external_attr = 0o644 << 16
                file_info.compress_type = zipfile.ZIP_DEFLATED
                zipf.writestr(file_info, file_bytes)
                print(f"  + {posix_arcname}")

    size_kb = os.path.getsize(output_zip) / 1024
    print(f"Created Linux/Unix-compatible zip: {output_zip} ({size_kb:.2f} KB)")


if __name__ == '__main__':
    package_plugin()
