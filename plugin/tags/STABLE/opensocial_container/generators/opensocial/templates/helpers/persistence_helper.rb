module Feeds::PersistenceHelper
  def href_from(src)
    global_feeds_app_persistence_url(:app_id => @app, :key => src.key)
  end
end