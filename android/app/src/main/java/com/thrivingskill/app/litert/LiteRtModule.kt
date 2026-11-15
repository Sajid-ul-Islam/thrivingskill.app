package com.thrivingskill.app.litert

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.google.android.gms.tflite.client.TfLiteInitializationOptions
import com.google.android.gms.tflite.java.TfLite
import kotlin.math.sqrt

/**
 * Native Module for Google LiteRT in Google Play Services.
 * Dynamically loads the TensorFlow Lite runtime and Drift GPU acceleration delegates
 * from Google Play Services, avoiding APK binary bloat and providing hardware-accelerated
 * on-device machine learning for ThrivingSkills.
 */
class LiteRtModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private var isInitialized = false
  private var isGpuEnabled = false
  private var initError: String? = null

  override fun getName(): String {
    return "LiteRtModule"
  }

  @ReactMethod
  fun initializeRuntime(enableGpu: Boolean, promise: Promise) {
    try {
      val optionsBuilder = TfLiteInitializationOptions.builder()
      if (enableGpu) {
        optionsBuilder.setEnableGpuDelegateSupport(true)
      }
      val options = optionsBuilder.build()

      TfLite.initialize(reactApplicationContext, options)
        .addOnSuccessListener {
          isInitialized = true
          isGpuEnabled = enableGpu
          initError = null
          val map = Arguments.createMap().apply {
            putBoolean("isInitialized", true)
            putBoolean("isGpuEnabled", enableGpu)
            putString("runtimeSource", "Google Play Services (LiteRT Drift GPU)")
          }
          promise.resolve(map)
        }
        .addOnFailureListener {
          // Fall back to CPU runtime if GPU delegate initialization fails on older devices
          TfLite.initialize(reactApplicationContext)
            .addOnSuccessListener {
              isInitialized = true
              isGpuEnabled = false
              initError = null
              val map = Arguments.createMap().apply {
                putBoolean("isInitialized", true)
                putBoolean("isGpuEnabled", false)
                putString("runtimeSource", "Google Play Services (LiteRT CPU)")
              }
              promise.resolve(map)
            }
            .addOnFailureListener { fallbackErr ->
              isInitialized = false
              initError = fallbackErr.message
              promise.reject("LITERT_INIT_FAILED", fallbackErr.message, fallbackErr)
            }
        }
    } catch (e: Exception) {
      isInitialized = false
      initError = e.message
      promise.reject("LITERT_EXCEPTION", e.message, e)
    }
  }

  @ReactMethod
  fun getRuntimeStatus(promise: Promise) {
    val map = Arguments.createMap().apply {
      putBoolean("isInitialized", isInitialized)
      putBoolean("isGpuEnabled", isGpuEnabled)
      putString("runtimeSource", if (isInitialized) "Google Play Services (LiteRT)" else "Not Initialized")
      putString("lastError", initError)
    }
    promise.resolve(map)
  }

  @ReactMethod
  fun computeSimilarity(vectorA: ReadableArray, vectorB: ReadableArray, promise: Promise) {
    try {
      val size = vectorA.size()
      if (size != vectorB.size() || size == 0) {
        promise.resolve(0.0)
        return
      }

      var dotProduct = 0.0
      var normA = 0.0
      var normB = 0.0

      for (i in 0 until size) {
        val valA = vectorA.getDouble(i)
        val valB = vectorB.getDouble(i)
        dotProduct += valA * valB
        normA += valA * valA
        normB += valB * valB
      }

      val denominator = sqrt(normA) * sqrt(normB)
      val similarity = if (denominator > 0.0) dotProduct / denominator else 0.0
      promise.resolve(similarity)
    } catch (e: Exception) {
      promise.reject("SIMILARITY_COMPUTATION_ERROR", e.message, e)
    }
  }
}
