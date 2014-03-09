package com.example.android.news;

import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.ActionBarActivity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.Window;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class WebViewActivity extends ActionBarActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// Support ActionBar progress indicators on rev 7+ 
		supportRequestWindowFeature(Window.FEATURE_PROGRESS);
		supportRequestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
		
		setContentView(R.layout.activity_web_view);
		// Support ActionBar Home button on rev 7+
		getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        
		Intent intent = getIntent();
		String URL = intent.getStringExtra(NewsListActivity.TINY_URL);
		WebView view = (WebView)findViewById(R.id.webView1);
		view.setWebViewClient(new WebViewClient() {
	        @Override
	        public boolean shouldOverrideUrlLoading(WebView view, String url) {
	            return false;
	        }
	        
	        @Override
			public void onLoadResource(WebView view, String url) {
				super.onLoadResource(view, url);
				// Update actionbar progress indicator
				setSupportProgressBarIndeterminate(true);
				setSupportProgressBarIndeterminateVisibility(true);
			}

			@Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Update actionbar progress indicator
                setSupportProgressBarIndeterminateVisibility(false);
            }
		});
		//view.getSettings().setJavaScriptEnabled(true);
		view.loadUrl(URL);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		getMenuInflater().inflate(R.menu.web_view, menu);
		return super.onCreateOptionsMenu(menu);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Implements actionbar home button
		switch (item.getItemId()) {
		case android.R.id.home:
			NavUtils.navigateUpFromSameTask(this);
			return true;
		}
		return super.onOptionsItemSelected(item);
	}

}
