class CreateOpenSocialContainerDependencies < ActiveRecord::Migration
  def self.up
    create_table :apps do |t|
      t.string :source_url
      t.string :title
      t.text :description
      t.string :directory_title
      t.string :title_url
      t.string :author
      t.string :author_email
      t.string :author_affiliation
      t.string :author_location
      t.string :screenshot
      t.string :thumbnail
      t.integer :height
      t.integer :width
      t.boolean :scaling
      t.boolean :scrolling
      t.boolean :singleton
      t.string :author_photo
      t.text :author_aboutme
      t.string :author_link
      t.text :author_quote

      t.timestamps
    end
    
    create_table :persistences do |t|
      t.integer :person_id, :app_id
      t.string :type, :instance_id, :key, :value
      
      t.timestamps
    end
  end

  def self.down
    drop_table :apps
    drop_table :persistence
  end
end
