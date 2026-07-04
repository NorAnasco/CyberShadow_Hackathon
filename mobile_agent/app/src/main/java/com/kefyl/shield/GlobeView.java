package com.kefyl.shield;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;
import android.animation.ValueAnimator;
import android.view.animation.LinearInterpolator;

public class GlobeView extends View {
    private Paint gridPaint;
    private Paint dotPaintRed;
    private Paint dotPaintGreen;
    private Paint outerRingPaint;
    private float rotationAngle = 0f;
    private ValueAnimator animator;

    private static class Dot {
        float lat; // -90 to 90
        float lon; // -180 to 180
        boolean isThreat;
        float pulsePhase = 0f;
        
        Dot(float lat, float lon, boolean isThreat) {
            this.lat = lat;
            this.lon = lon;
            this.isThreat = isThreat;
        }
    }

    private Dot[] dots = new Dot[] {
        new Dot(15f, -30f, true),
        new Dot(-20f, 60f, false),
        new Dot(45f, 120f, false),
        new Dot(-10f, -45f, true),
        new Dot(30f, -10f, false),
        new Dot(-35f, 10f, true)
    };

    public GlobeView(Context context) {
        super(context);
        init();
    }

    public GlobeView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public GlobeView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        gridPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        gridPaint.setColor(Color.parseColor("#00C896"));
        gridPaint.setStyle(Paint.Style.STROKE);
        gridPaint.setStrokeWidth(1.5f);
        gridPaint.setAlpha(80); // Subtle opacity for wireframe

        outerRingPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        outerRingPaint.setColor(Color.parseColor("#00C896"));
        outerRingPaint.setStyle(Paint.Style.STROKE);
        outerRingPaint.setStrokeWidth(1.2f);
        outerRingPaint.setAlpha(120);
        outerRingPaint.setPathEffect(new DashPathEffect(new float[]{8f, 12f}, 0));

        dotPaintRed = new Paint(Paint.ANTI_ALIAS_FLAG);
        dotPaintRed.setColor(Color.parseColor("#EF4444"));
        dotPaintRed.setStyle(Paint.Style.FILL);

        dotPaintGreen = new Paint(Paint.ANTI_ALIAS_FLAG);
        dotPaintGreen.setColor(Color.parseColor("#00C896"));
        dotPaintGreen.setStyle(Paint.Style.FILL);

        // Start continuous rotation animator
        animator = ValueAnimator.ofFloat(0f, 360f);
        animator.setDuration(12000); // 12 seconds per rotation
        animator.setRepeatCount(ValueAnimator.INFINITE);
        animator.setInterpolator(new LinearInterpolator());
        animator.addUpdateListener(animation -> {
            rotationAngle = (float) animation.getAnimatedValue();
            // Update pulse phase of dots
            for (Dot dot : dots) {
                dot.pulsePhase += 0.05f;
            }
            invalidate();
        });
        animator.start();
    }

    @Override
    protected void onDetachedFromWindow() {
        if (animator != null) {
            animator.cancel();
        }
        super.onDetachedFromWindow();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int width = getWidth();
        int height = getHeight();
        float radius = Math.min(width, height) * 0.4f;
        float centerX = width / 2f;
        float centerY = height / 2f;

        // 1. Draw outer dashed ring
        canvas.drawCircle(centerX, centerY, radius * 1.15f, outerRingPaint);

        // 2. Draw sphere outline
        canvas.drawCircle(centerX, centerY, radius, gridPaint);

        // 3. Draw horizontal latitude lines (ellipses)
        RectF latRect = new RectF();
        for (float lat = -75; lat <= 75; lat += 25) {
            if (lat == 0) {
                // Equator
                canvas.drawLine(centerX - radius, centerY, centerX + radius, centerY, gridPaint);
            } else {
                float latRadius = radius * (float) Math.cos(Math.toRadians(lat));
                float latY = centerY + radius * (float) Math.sin(Math.toRadians(lat));
                latRect.set(centerX - latRadius, latY - (latRadius * 0.15f), centerX + latRadius, latY + (latRadius * 0.15f));
                canvas.drawOval(latRect, gridPaint);
            }
        }

        // 4. Draw rotating longitudinal lines
        RectF lonRect = new RectF();
        for (int i = 0; i < 6; i++) {
            float baseAngle = i * 30f + rotationAngle;
            float cosAngle = (float) Math.cos(Math.toRadians(baseAngle));
            float currentWidth = radius * cosAngle;
            lonRect.set(centerX - Math.abs(currentWidth), centerY - radius, centerX + Math.abs(currentWidth), centerY + radius);
            
            gridPaint.setAlpha((int) (60 + 50 * Math.abs(cosAngle)));
            canvas.drawOval(lonRect, gridPaint);
        }
        gridPaint.setAlpha(80); // Reset alpha

        // 5. Draw threat/agent dots
        for (Dot dot : dots) {
            float dotLon = dot.lon + rotationAngle;
            float cosLon = (float) Math.cos(Math.toRadians(dotLon));
            float sinLon = (float) Math.sin(Math.toRadians(dotLon));
            float cosLat = (float) Math.cos(Math.toRadians(dot.lat));
            float sinLat = (float) Math.sin(Math.toRadians(dot.lat));

            if (cosLon < 0) {
                continue; 
            }

            float x = centerX + radius * cosLat * sinLon;
            float y = centerY - radius * sinLat;

            Paint p = dot.isThreat ? dotPaintRed : dotPaintGreen;
            
            float pulse = 1f + 0.3f * (float) Math.sin(dot.pulsePhase);
            float baseRadius = radius * 0.05f;
            
            p.setAlpha((int) (180 + 75 * Math.sin(dot.pulsePhase)));
            canvas.drawCircle(x, y, baseRadius * pulse, p);
        }
    }
}
