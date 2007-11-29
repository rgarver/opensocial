class OpensocialGenerator < Rails::Generator::Base
  def manifest
    resources = %w(people apps activities)
    
    record do |m|
      m.directory 'app/controllers/feeds'
      m.directory 'app/helpers/feeds'
      m.directory 'app/models/feeds'
      resources.each do |resource|
        m.directory "app/views/feeds/#{resource}"
      end
      m.directory 'db/migrate'
      
      # Controllers
      m.template 'apps_controller.rb', 'app/controllers/feeds/apps_controller.rb'
      m.template 'people_controller.rb', 'app/controllers/feeds/people_controller.rb'
      
      # Helpers
      m.template 'people_helper.rb', 'app/helpers/feeds/people_helper.rb'
      
      # Models
      m.template 'app.rb', 'app/models/feeds/app.rb'
      
      # Migrations
      m.migration_template 'create_apps.rb', 'db/migrate', :migration_file_name => 'create_apps'
      
      # Views
      %w(index edit new show).each do |action|
        m.file "apps/#{action}.html.erb", "app/views/feeds/apps/#{action}.html.erb"
      end
      m.file "people/show.xml.builder", "app/views/feeds/people/show.xml.builder"
      m.file "people/friends.xml.builder", "app/views/feeds/people/friends.xml.builder"
      
      # Routes (need to look at adding support for namespace matching on this, fake it for now)
      # m.route_resources 'apps', :path_prefix => 'feeds', :name_prefix => 'feeds_', :namespace => 'feeds/'
    end
  end
  
private
  def get_latest_migration_number
    Dir[File.join(RAILS_ROOT, 'db/migrate/*')].map{|name| File.basename(name)}.sort.last[/^([0-9]+)_/, 1].succ
  end
end