// Android reuses dead HTTP/2 connections after a network change, so ping them and drop the pool on every change.
const fs = require("fs");
const path = require("path");
const { withDangerousMod, withMainApplication } = require("expo/config-plugins");

const KOTLIN = (pkg) => `package ${pkg}

import android.app.Application
import android.net.ConnectivityManager
import android.net.Network
import com.facebook.react.modules.network.OkHttpClientProvider
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient

object NetworkRecovery {
  private var client: OkHttpClient? = null

  fun install(app: Application) {
    OkHttpClientProvider.setOkHttpClientFactory {
      client ?: OkHttpClientProvider.createClientBuilder(app)
        .pingInterval(10, TimeUnit.SECONDS)
        .build()
        .also { client = it }
    }
    val connectivity = app.getSystemService(ConnectivityManager::class.java)
    connectivity.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
      override fun onAvailable(network: Network) = dropPool()
      override fun onLost(network: Network) = dropPool()
    })
  }

  private fun dropPool() {
    client?.connectionPool?.evictAll()
  }
}
`;

const INSTALL_CALL = "NetworkRecovery.install(this)";

module.exports = function withNetworkRecovery(config) {
  const pkg = config.android.package;

  config = withDangerousMod(config, [
    "android",
    (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, "app/src/main/java", ...pkg.split("."));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "NetworkRecovery.kt"), KOTLIN(pkg));
      return cfg;
    },
  ]);

  return withMainApplication(config, (cfg) => {
    if (!cfg.modResults.contents.includes(INSTALL_CALL)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        "    loadReactNative(this)",
        `    ${INSTALL_CALL}\n    loadReactNative(this)`,
      );
    }
    if (!cfg.modResults.contents.includes(INSTALL_CALL)) {
      throw new Error("with-network-recovery: could not find loadReactNative(this) in MainApplication");
    }
    return cfg;
  });
};
