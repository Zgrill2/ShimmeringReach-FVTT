import pathlib, os, shutil

SYSTEM_NAME = 'shimmeringreach'
INSTALL_PATH = f'/mnt/c/Users/Gamer/AppData/Local/FoundryVTT/Data/systems/{SYSTEM_NAME}'

cfl = pathlib.Path(__file__).parent.absolute()
sr_path = os.path.join(cfl, '..', SYSTEM_NAME)
print(f'{sr_path}')

def copy_and_overwrite(from_path, to_path):
    if os.path.exists(to_path):
        shutil.rmtree(to_path)
    shutil.copytree(from_path, to_path)

copy_and_overwrite(sr_path, INSTALL_PATH)
