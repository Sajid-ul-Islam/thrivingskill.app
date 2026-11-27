#!/usr/bin/env bash
# Installs real WordPress core, the WordPress PHPUnit test suite, LearnPress,
# and WooCommerce for backend-plugin integration tests.
set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage: $0 <db-name> <db-user> <db-pass> [db-host] [wp-version] [skip-db-create]"
  exit 1
fi

DB_NAME=$1
DB_USER=$2
DB_PASS=$3
DB_HOST=${4:-127.0.0.1}
WP_VERSION=${5:-latest}
SKIP_DB_CREATE=${6:-false}

TMPDIR=${TMPDIR:-/tmp}
TMPDIR=${TMPDIR%/}
WP_TESTS_DIR=${WP_TESTS_DIR:-"${TMPDIR}/wordpress-tests-lib"}
WP_CORE_DIR=${WP_CORE_DIR:-"${TMPDIR}/wordpress"}
WP_PLUGINS_DIR=${WP_PLUGINS_DIR:-"${WP_CORE_DIR}/wp-content/plugins"}

download() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then
    wget -nv -O "$2" "$1"
  else
    echo "Neither curl nor wget is installed." >&2
    exit 1
  fi
}

install_wp() {
  if [ -d "${WP_CORE_DIR}" ] && [ -f "${WP_CORE_DIR}/wp-load.php" ]; then
    echo "WordPress core already present at ${WP_CORE_DIR}"
    return
  fi

  mkdir -p "${WP_CORE_DIR}"
  local wp_archive="${TMPDIR}/wordpress.tar.gz"
  if [ "${WP_VERSION}" = "latest" ]; then
    download "https://wordpress.org/latest.tar.gz" "${wp_archive}"
  else
    download "https://wordpress.org/wordpress-${WP_VERSION}.tar.gz" "${wp_archive}"
  fi
  tar --strip-components=1 -xzf "${wp_archive}" -C "${WP_CORE_DIR}"
  rm -f "${wp_archive}"
}

install_test_suite() {
  local wp_tag=""
  if [ "${WP_VERSION}" = "latest" ]; then
    wp_tag=$(php -r 'echo trim(file_get_contents("https://api.wordpress.org/core/version-check/1.7/"));' | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["offers"][0]["version"] ?? "";')
    if [ -z "${wp_tag}" ]; then
      echo "Could not resolve latest WordPress version tag" >&2
      exit 1
    fi
  else
    wp_tag="${WP_VERSION}"
  fi

  if [ ! -d "${WP_TESTS_DIR}/includes" ] || [ ! -d "${WP_TESTS_DIR}/data" ]; then
    mkdir -p "${WP_TESTS_DIR}"
    local wp_dev_dir="${TMPDIR}/wp-dev-tests"
    rm -rf "${wp_dev_dir}"
    git clone --depth=1 --branch "${wp_tag}" --filter=blob:none --sparse https://github.com/WordPress/wordpress-develop.git "${wp_dev_dir}"
    git -C "${wp_dev_dir}" sparse-checkout set tests/phpunit/includes tests/phpunit/data
    cp -a "${wp_dev_dir}/tests/phpunit/includes" "${WP_TESTS_DIR}/"
    cp -a "${wp_dev_dir}/tests/phpunit/data" "${WP_TESTS_DIR}/"
    rm -rf "${wp_dev_dir}"
  fi

  cat > "${WP_TESTS_DIR}/wp-tests-config.php" <<EOF
<?php
define( 'ABSPATH', '${WP_CORE_DIR}/' );
define( 'DB_NAME', '${DB_NAME}' );
define( 'DB_USER', '${DB_USER}' );
define( 'DB_PASSWORD', '${DB_PASS}' );
define( 'DB_HOST', '${DB_HOST}' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );
\$table_prefix = 'wptests_';
define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'Thriving Skills Integration Tests' );
define( 'WP_PHP_BINARY', 'php' );
define( 'WPLANG', '' );
EOF
}

install_plugin() {
  local slug=$1
  local dest="${WP_PLUGINS_DIR}/${slug}"
  if [ -d "${dest}" ]; then
    echo "Plugin ${slug} already installed at ${dest}"
    return
  fi

  mkdir -p "${WP_PLUGINS_DIR}"
  local zip_path="${TMPDIR}/${slug}.zip"
  echo "Downloading official WordPress.org plugin: ${slug}..."
  download "https://downloads.wordpress.org/plugin/${slug}.latest-stable.zip" "${zip_path}"
  unzip -q -o "${zip_path}" -d "${WP_PLUGINS_DIR}"
  rm -f "${zip_path}"
}

install_db() {
  if [ "${SKIP_DB_CREATE}" = "true" ]; then
    return
  fi
  local host_part="${DB_HOST%%:*}"
  local port_part="${DB_HOST##*:}"
  local port_args=()
  if [ "${host_part}" != "${port_part}" ]; then
    port_args=(--port="${port_part}")
  fi
  if command -v mysql >/dev/null 2>&1; then
    MYSQL_PWD="${DB_PASS}" mysql --protocol=TCP --host="${host_part}" "${port_args[@]}" --user="${DB_USER}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;"
  fi
}

install_wp
install_test_suite
install_plugin "woocommerce"
install_plugin "learnpress"
install_db

echo "✅ Real WordPress integration environment installed:"
echo "   WP_CORE_DIR=${WP_CORE_DIR}"
echo "   WP_TESTS_DIR=${WP_TESTS_DIR}"
echo "   WP_PLUGINS_DIR=${WP_PLUGINS_DIR}"
