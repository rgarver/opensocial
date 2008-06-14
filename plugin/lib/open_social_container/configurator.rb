module OpenSocialContainer
  class Configuration
    cattr_accessor :person_class
    cattr_accessor :activity_class
    
    # Used to sign the data being passed from the Host frame to the Container frame.
    cattr_accessor :secret
    
    cattr_accessor :app_domain
  end
end