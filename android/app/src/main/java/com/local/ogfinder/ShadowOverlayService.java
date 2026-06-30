package com.local.ogfinder;

import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ShadowOverlayService extends Service {
    public static final String ACTION_START = "com.local.ogfinder.START_SHADOW_OVERLAY";
    public static final String ACTION_STOP = "com.local.ogfinder.STOP_SHADOW_OVERLAY";
    public static final String EXTRA_CANDIDATES = "candidates";
    public static final String EXTRA_START_INDEX = "startIndex";
    public static final String PREFS_NAME = "shadow_overlay";
    public static final String PREF_RESULTS = "results";

    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams params;
    private JSONArray candidates = new JSONArray();
    private int index = 0;
    private TextView usernameView;
    private TextView countView;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent != null) {
            try {
                candidates = new JSONArray(intent.getStringExtra(EXTRA_CANDIDATES));
            } catch (JSONException ignored) {
                candidates = new JSONArray();
            }
            index = Math.max(0, intent.getIntExtra(EXTRA_START_INDEX, 0));
        }

        showOverlay();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (windowManager != null && overlayView != null) {
            windowManager.removeView(overlayView);
        }
        overlayView = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void showOverlay() {
        if (overlayView != null) {
            updateCandidate();
            return;
        }

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        overlayView = buildView();
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 24;
        params.y = 140;
        windowManager.addView(overlayView, params);
        updateCandidate();
    }

    private View buildView() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(20, 18, 20, 18);
        root.setBackgroundColor(Color.rgb(17, 20, 24));

        TextView title = text("OG Shadow", 13, Color.rgb(215, 247, 91));
        usernameView = text("", 24, Color.WHITE);
        countView = text("", 12, Color.rgb(160, 166, 176));
        root.addView(title);
        root.addView(usernameView);
        root.addView(countView);

        LinearLayout row1 = row();
        row1.addView(button("Copy", v -> copyCurrent()));
        row1.addView(button("WhatsApp", v -> openWhatsApp()));
        root.addView(row1);

        LinearLayout row2 = row();
        row2.addView(button("Avail", v -> mark("available")));
        row2.addView(button("Taken", v -> mark("taken")));
        row2.addView(button("Invalid", v -> mark("invalid")));
        root.addView(row2);

        LinearLayout row3 = row();
        row3.addView(button("Prev", v -> move(-1)));
        row3.addView(button("Next", v -> move(1)));
        row3.addView(button("Close", v -> stopSelf()));
        root.addView(row3);

        root.setOnTouchListener(new DragListener());
        return root;
    }

    private LinearLayout row() {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(0, 8, 0, 0);
        return row;
    }

    private TextView text(String value, int size, int color) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setPadding(0, 2, 0, 2);
        return view;
    }

    private Button button(String label, View.OnClickListener listener) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(12);
        button.setAllCaps(false);
        button.setOnClickListener(listener);
        return button;
    }

    private String current() {
        if (candidates.length() == 0) {
            return "";
        }
        index = Math.max(0, Math.min(index, candidates.length() - 1));
        return candidates.optString(index, "");
    }

    private void updateCandidate() {
        String value = current();
        usernameView.setText(value.isEmpty() ? "No names" : value);
        countView.setText(candidates.length() == 0 ? "Generate names in the app" : (index + 1) + " / " + candidates.length());
    }

    private void move(int delta) {
        if (candidates.length() == 0) {
            return;
        }
        index = Math.max(0, Math.min(candidates.length() - 1, index + delta));
        updateCandidate();
    }

    private void copyCurrent() {
        String value = current();
        if (value.isEmpty()) {
            return;
        }
        ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        clipboard.setPrimaryClip(ClipData.newPlainText("username", value));
        Toast.makeText(this, "Copied " + value, Toast.LENGTH_SHORT).show();
    }

    private void openWhatsApp() {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("whatsapp://"));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(intent);
        } catch (Exception ignored) {
            Intent market = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.whatsapp"));
            market.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(market);
        }
    }

    private void mark(String status) {
        String value = current();
        if (value.isEmpty()) {
            return;
        }
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        JSONObject results;
        try {
            results = new JSONObject(prefs.getString(PREF_RESULTS, "{}"));
            JSONObject item = new JSONObject();
            item.put("status", status);
            item.put("timestamp", System.currentTimeMillis());
            results.put(value, item);
            prefs.edit().putString(PREF_RESULTS, results.toString()).apply();
        } catch (JSONException ignored) {
            return;
        }
        Toast.makeText(this, value + " marked " + status, Toast.LENGTH_SHORT).show();
        move(1);
    }

    private final class DragListener implements View.OnTouchListener {
        private int startX;
        private int startY;
        private float touchX;
        private float touchY;

        @Override
        public boolean onTouch(View view, MotionEvent event) {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    startX = params.x;
                    startY = params.y;
                    touchX = event.getRawX();
                    touchY = event.getRawY();
                    return false;
                case MotionEvent.ACTION_MOVE:
                    params.x = startX + (int) (event.getRawX() - touchX);
                    params.y = startY + (int) (event.getRawY() - touchY);
                    windowManager.updateViewLayout(overlayView, params);
                    return false;
                default:
                    return false;
            }
        }
    }
}
