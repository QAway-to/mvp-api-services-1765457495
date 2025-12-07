package com.example.mvpapp.ui.detail

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mvpapp.data.model.DataItem
import com.example.mvpapp.databinding.ActivityDetailBinding

class DetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDetailBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        displayItem()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Details"
    }

    private fun displayItem() {
        val item = intent.getParcelableExtra<DataItem>("item")
        if (item != null) {
            binding.apply {
                titleText.text = item.title
                descriptionText.text = item.description
                idText.text = "ID: ${item.id}"
            }
        } else {
            Toast.makeText(this, "Item not found", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}

