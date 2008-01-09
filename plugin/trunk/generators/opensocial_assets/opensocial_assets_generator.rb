class OpensocialAssetsGenerator < Rails::Generator::Base
  attr_reader :destination_directory
  
  def initialize(runtime_args, runtime_options = {})
    @destination_directory = 'public/javascripts/opensocial/container'
    super
  end
  
  def manifest
    record do |m|
      m.directory destination_directory
      %w(opensocial collection container person activity datarequest dataresponse responseitem surface).each do |j|
        m.file "#{j}.js", File.join(destination_directory, "#{j}.js")
      end
      m.file 'ig_base.js', File.join(destination_directory, 'ig_base.js')
    end
  end
end