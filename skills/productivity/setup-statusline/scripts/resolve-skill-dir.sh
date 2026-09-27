# Sourced by the installers. Sets SKILL_DIR to a path that outlives plugin updates.
#
# Run from the installed plugin, the scripts sit under
# plugins/cache/<marketplace>/<plugin>/<version>/, and that version directory is
# deleted when the plugin updates, which would leave every link and settings
# command pointing at nothing. The marketplace clone at
# plugins/marketplaces/<marketplace>/ is updated in place, so point there
# instead. Run from a checkout of the repo, SKILL_DIR is left as it is.

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "$SKILL_DIR" in
  */plugins/cache/*/*/*/*)
    plugins_root="${SKILL_DIR%%/plugins/cache/*}/plugins"
    rest="${SKILL_DIR#"$plugins_root"/cache/}"
    marketplace="${rest%%/*}"
    rest="${rest#*/}"   # drop <marketplace>
    rest="${rest#*/}"   # drop <plugin>
    rest="${rest#*/}"   # drop <version>
    stable="$plugins_root/marketplaces/$marketplace/$rest"
    if [ -d "$stable" ]; then
      SKILL_DIR="$stable"
    else
      echo "warning: $stable not found; linking the versioned plugin cache, which the next plugin update will remove" >&2
    fi
    ;;
esac
