{ pkgs, ... }: {
  packages = [ pkgs.nodejs ];
  dotenv.enable = true;
  enterShell = ''
    export NPM_CONFIG_PREFIX="$HOME/.npm-global"
    export PATH="$NPM_CONFIG_PREFIX/bin:$PATH"

    # Symlink devenv venv so ty can auto-discover it
    if [ -d .devenv/state/venv ] && [ ! -e backend/.venv ]; then
      ln -s ../.devenv/state/venv backend/.venv
    fi
  '';
  languages.python = {
    enable = true;
    version = "3.12";
    directory = "./backend/";
    uv = {
      enable = true;
      sync.enable = false;
    };
  };
  languages.javascript = {
    enable = true;
    directory = "./ui/";
    pnpm = {
      enable = true;
      install.enable = true;
    };
  };
}
