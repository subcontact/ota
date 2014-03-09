package com.example.android.news;

import android.util.Log;


public class NewsItem implements Comparable<NewsItem> {
	private String id;
	private String headLine;
	private String slugLine;
	private String dateLine;
	private String imageURI;
	private String tinyURL;
	
	public NewsItem() {
		super();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getHeadLine() {
		return headLine;
	}

	public void setHeadLine(String headLine) {
		this.headLine = headLine;
	}

	public String getSlugLine() {
		return slugLine;
	}

	public void setSlugLine(String slugLine) {
		this.slugLine = slugLine;
	}
	
	public String getDateLine() {
		return dateLine;
	}

	public void setDateLine(String dateLine) {
		this.dateLine = dateLine;
	}

	public String getTinyURL() {
		return tinyURL;
	}

	public void setTinyURL(String tinyURL) {
		this.tinyURL = tinyURL;
	}

	public String getImageURI() {
		return imageURI;
	}
	
	public boolean hasImageURI() {
		return imageURI != null;
	}

	public void setImageURI(String imageURI) {
		Log.i("NewsItem", imageURI);
		this.imageURI = imageURI;
	}
	
	public int compareTo(NewsItem item) {
		// Compare news item date > headline > id as sort order
		int cmp = dateLine.compareTo(item.getDateLine());
		if (cmp == 0) cmp = headLine.compareTo(item.getHeadLine());
		if (cmp == 0) cmp = id.compareTo(item.getId());
		return cmp;
	}
	
	public String toString() {
		return headLine;
	}
}
