/*
 * Copyright (C) 2009 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.example.android.contactmanager;

import org.apache.cordova.CordovaWebView;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.EditText;
import android.widget.LinearLayout;

public final class LaunchActivity extends Activity
{

    public static final String TAG = "ContactManager";
    public static String webViewURLText;
	private EditText mWebviewURLEditText;

    private Button mStandardWebViewButton;
    private Button mEmbeddedCordovaWebViewButton;
    private Button mAndroidBrowserButton;
    private ProgressBar mLoadingProgress; 
    private WebView mStandardWebView;
    private LinearLayout mConfigScreen;

    /**
     * Called when the activity is first created. Responsible for initializing the UI.
     */
    @SuppressLint("SetJavaScriptEnabled")
	@Override
    public void onCreate(Bundle savedInstanceState)
    {
        Log.v(TAG, "Activity State: onCreate()");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.launch_activity);

        mStandardWebView = (WebView) findViewById(R.id.standardWebView);
        mLoadingProgress = (ProgressBar) findViewById(R.id.loadingProgress);
        mConfigScreen = (LinearLayout) findViewById(R.id.config);
        
        WebViewClient webviewClient = new WebViewClient() {

			@Override
			public void onPageFinished(WebView view, String url) {
				// TODO Auto-generated method stub
				super.onPageFinished(view, url);
				mLoadingProgress.setVisibility(View.INVISIBLE);
		        mStandardWebView.setVisibility(View.VISIBLE);
			}
        	
        };
        mStandardWebView.clearCache(true);
        mStandardWebView.clearHistory();  
        mStandardWebView.setWebViewClient(webviewClient);
        mStandardWebView.setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);
        mStandardWebView.getSettings().setSupportZoom(true);
        mStandardWebView.setInitialScale(0);
        mStandardWebView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
		mStandardWebView.getSettings().setJavaScriptEnabled(true);
        
        // Obtain handles to UI objects
		mStandardWebViewButton = (Button) findViewById(R.id.standardWebViewButton);
		mEmbeddedCordovaWebViewButton = (Button) findViewById(R.id.embeddedCordovaWebViewButton);
		mAndroidBrowserButton = (Button) findViewById(R.id.androidBrowserButton);
     	mWebviewURLEditText = (EditText) findViewById(R.id.webviewURL);

        // Register handler for UI elements
		mStandardWebViewButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Log.d(TAG, "standardWebViewButton clicked");
                 getWebViewURL();
	        	 launchStandardWebView();
	        	 //launchCordovaWebViewActivity();
            }
        });
		
        // Register handler for UI elements
		mEmbeddedCordovaWebViewButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Log.d(TAG, "mEmbeddedCordovaWebViewButton clicked");
                getWebViewURL();
	        	 //launchStandardWebView();
	        	 launchCordovaWebViewActivity();
            }
        });
		
        // Register handler for UI elements
		mAndroidBrowserButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Log.d(TAG, "mAndroidBrowserButton clicked");
                //getWebViewURL();
	        	 //launchStandardWebView();
                launchAndroidBrowser(getWebViewURL());
            }
        });
    }
    
    private String getWebViewURL() {
    	
		 if (mWebviewURLEditText.getText() != null) {
			 webViewURLText = mWebviewURLEditText.getText().toString();
		 } else {
			 webViewURLText = "";
		 }
		 Log.d(TAG, webViewURLText);
		 return webViewURLText;
    }
    
    @Override
	public void onBackPressed() {
		// TODO Auto-generated method stub
		//super.onBackPressed();
		
		if (mStandardWebView.getVisibility() == View.VISIBLE) {
			
			if (mStandardWebView.canGoBack()) {
				mStandardWebView.goBack();
			} else {
				mStandardWebView.setVisibility(View.INVISIBLE);
				//mConfigScreen.setEnabled(true);
			}
		}
	}

    protected void launchAndroidBrowser(String url) {
    	if (!url.startsWith("https://") && !url.startsWith("http://")){
    	    url = "http://" + url;
    	}
    	Intent openUrlIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
    	startActivity(openUrlIntent);    	
    }

	/**
     * 
     */
    protected void launchStandardWebView() {
		//mConfigScreen.setEnabled(false);
    	mLoadingProgress.setVisibility(View.VISIBLE);
    	mStandardWebView.loadUrl(LaunchActivity.webViewURLText + "?isNative");
    }
    
    protected void launchCordovaWebViewActivity() {
	    Intent intent = new Intent(this, EmbeddedCordovaWebViewActivity.class);
	    startActivity(intent);
    }
}
