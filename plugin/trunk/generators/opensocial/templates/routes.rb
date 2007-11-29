ActionController::Routing::Routes.draw do |map|
  map.namespace :feeds do |feed|
    feed.resources :apps do |app|
      app.resources :persistence, :collection => {:global => :get}, :member => {:friends => :get} do |persistent|
        persistent.resources :shared
        persistent.resources :instance
      end
    end
    feed.resources :people, :member => {:friends => :get}
  end

  map.resources :users
  map.resource :session
  
  map.opensocial_container :contain
end
