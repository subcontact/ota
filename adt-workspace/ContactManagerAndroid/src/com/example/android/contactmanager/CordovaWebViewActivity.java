package com.example.android.contactmanager;

import android.os.Bundle;
import android.util.Log;
import android.widget.EditText;

import org.apache.cordova.*;

public class CordovaWebViewActivity  extends CordovaActivity {
	
	public static final String TAG = "WebView";
	
	@Override
	public void onCreate(Bundle savedInstanceState)
	{
	 super.onCreate(savedInstanceState);
	 super.init();
	 //super.loadUrl(Config.getStartUrl());
	 super.loadUrl(LaunchActivity.webViewURLText);
	}
}
