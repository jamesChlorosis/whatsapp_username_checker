package com.local.ogfinder;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShadowOverlay")
public class ShadowOverlayPlugin extends Plugin {
    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", canDrawOverlays());
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (canDrawOverlays()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        Intent intent = new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName())
        );
        getActivity().startActivity(intent);
        JSObject result = new JSObject();
        result.put("granted", false);
        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!canDrawOverlays()) {
            call.reject("Overlay permission is not enabled");
            return;
        }

        String candidatesJson = call.getString("candidates", "[]");
        int startIndex = call.getInt("startIndex", 0);
        Intent intent = new Intent(getContext(), ShadowOverlayService.class);
        intent.setAction(ShadowOverlayService.ACTION_START);
        intent.putExtra(ShadowOverlayService.EXTRA_CANDIDATES, candidatesJson);
        intent.putExtra(ShadowOverlayService.EXTRA_START_INDEX, startIndex);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), ShadowOverlayService.class);
        intent.setAction(ShadowOverlayService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void getResults(PluginCall call) {
        String results = getContext()
            .getSharedPreferences(ShadowOverlayService.PREFS_NAME, Context.MODE_PRIVATE)
            .getString(ShadowOverlayService.PREF_RESULTS, "{}");
        JSObject result = new JSObject();
        result.put("results", results);
        call.resolve(result);
    }

    private boolean canDrawOverlays() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext());
    }
}
