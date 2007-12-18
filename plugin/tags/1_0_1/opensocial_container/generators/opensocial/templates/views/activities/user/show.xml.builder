atom_feed do |feed|
  feed.title 'Feed Title'
  feed.category(:scheme => 'http://schemas.google.com/g/2005#kind', 
                :term => 'http://schemas.google.com/activities/2007#activity')
                
  @activities.each do |activity|
    feed.entry(activity, :url => feeds_activities_user_url(activity)) do |entry|
      entry.title activity.title 
      entry.category(:scheme => 'http://schemas.google.com/g/2005#kind',
                    :term => 'http://schemas.google.com/activities/2007#activity')
    end
  end
end