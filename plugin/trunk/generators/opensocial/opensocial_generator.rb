class OpensocialGenerator < Rails::Generator::Base
  def manifest
    resources = %w(people apps activities)
    
    record do |m|
      m.directory 'app/controllers/feeds'
      m.directory 'app/models/feeds'
      resources.each do |resource|
        m.directory "app/views/feeds/#{resource}"
      end
      m.directory 'db/migrate'
      
      # Controllers
      m.template 'apps_controller.rb', 'app/controllers/feeds/apps_controller.rb'
      
      # Models
      m.template 'app.rb', 'app/models/feeds/app.rb'
      
      # Migrations
      m.migration_template 'create_apps.rb', 'db/migrate'
      
      # Views
      %w(index edit new show).each do |action|
        m.template "apps/#{action}.html.erb", "app/views/feeds/apps/#{action}.html.erb"
      end
      
      # Routes (need to look at adding support for namespace matching on this, fake it for now)
      m.route_resouces :apps, :path_prefix => 'feeds', :name_prefix => 'feeds_', :namespace => 'feeds/'
    end
  end
  
private
  def get_latest_migration_number
    Dir[File.join(RAILS_ROOT, 'db/migrate/*')].map{|name| File.basename(name)}.sort.last[/^([0-9]+)_/, 1].succ
  end
end