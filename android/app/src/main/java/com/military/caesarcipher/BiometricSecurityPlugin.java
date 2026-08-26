package com.military.caesarcipher;

import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "BiometricSecurity")
public class BiometricSecurityPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            BiometricManager biometricManager = BiometricManager.from(getContext());
            int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK;
            int canAuthenticate = biometricManager.canAuthenticate(authenticators);

            boolean isAvailable = (canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS);
            boolean hasEnrolled = (canAuthenticate != BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED);

            String statusReason = "AVAILABLE";
            if (canAuthenticate == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
                statusReason = "NO_HARDWARE";
            } else if (canAuthenticate == BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE) {
                statusReason = "HW_UNAVAILABLE";
            } else if (canAuthenticate == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) {
                statusReason = "NOT_ENROLLED";
            } else if (canAuthenticate == BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED) {
                statusReason = "SECURITY_UPDATE_REQUIRED";
            }

            ret.put("isAvailable", isAvailable);
            ret.put("hasEnrolledBiometrics", hasEnrolled && canAuthenticate != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE);
            ret.put("biometryType", isAvailable ? "fingerprint" : "none");
            ret.put("statusReason", statusReason);
            ret.put("platform", "android");
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("isAvailable", false);
            ret.put("hasEnrolledBiometrics", false);
            ret.put("biometryType", "none");
            ret.put("statusReason", "ERROR: " + e.getMessage());
            ret.put("platform", "android");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        String title = call.getString("title", "Unlock Secure Communication");
        String subtitle = call.getString("subtitle", "Verify your identity to proceed");
        String cancelTitle = call.getString("cancelTitle", "Use PIN");

        getActivity().runOnUiThread(() -> {
            try {
                if (!(getActivity() instanceof FragmentActivity)) {
                    call.reject("Activity is not a FragmentActivity");
                    return;
                }

                FragmentActivity fragmentActivity = (FragmentActivity) getActivity();
                Executor executor = ContextCompat.getMainExecutor(getContext());

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setNegativeButtonText(cancelTitle)
                        .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK)
                        .build();

                BiometricPrompt biometricPrompt = new BiometricPrompt(fragmentActivity, executor, new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        super.onAuthenticationError(errorCode, errString);
                        JSObject ret = new JSObject();
                        ret.put("success", false);
                        ret.put("error", errString.toString());
                        ret.put("errorCode", errorCode);
                        ret.put("cancelled", errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON || errorCode == BiometricPrompt.ERROR_USER_CANCELED);
                        call.resolve(ret);
                    }

                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        call.resolve(ret);
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        super.onAuthenticationFailed();
                        // Note: Android system automatically allows retries before triggering onAuthenticationError
                    }
                });

                biometricPrompt.authenticate(promptInfo);
            } catch (Exception e) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", e.getMessage());
                call.resolve(ret);
            }
        });
    }

    @PluginMethod
    public void setFlagSecure(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        getActivity().runOnUiThread(() -> {
            try {
                if (enabled) {
                    getActivity().getWindow().setFlags(
                            WindowManager.LayoutParams.FLAG_SECURE,
                            WindowManager.LayoutParams.FLAG_SECURE
                    );
                } else {
                    getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                }
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("enabled", enabled);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to set FLAG_SECURE: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void isFlagSecureEnabled(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                int flags = getActivity().getWindow().getAttributes().flags;
                boolean isSecure = (flags & WindowManager.LayoutParams.FLAG_SECURE) != 0;
                JSObject ret = new JSObject();
                ret.put("enabled", isSecure);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to check FLAG_SECURE: " + e.getMessage());
            }
        });
    }
}
