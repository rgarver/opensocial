require File.dirname(__FILE__) + '/test_helper.rb'

class TestAuthentication < Test::Unit::TestCase
  def setup
    @url = 'https://orkut.com/feeds/'
    @username = 'foo'
    @password = 'notwhatyouthink'
    OpenSocial::API::Source.company = 'ELC Technologies'
    OpenSocial::API::Source.application = 'Testing'
    OpenSocial::API::Source.version = '1'
  end
  
  def test_setting_source
    assert_equal 'ELCTechnologies-Testing-1', OpenSocial::API::Source.to_s
  end
  
  def test_client_login_authentication
    # http_request = stub(:basic_auth => true, :request => stub(:body => ''))
    # http_stub = stub(:get => http_request)
    # Net::HTTP.stubs(:start).yields(http_stub)
    Net::HTTP::Post.any_instance.expects(:form_data=).with({:Email => @username, :Passwd => @password, 
      :source => 'ELCTechnologies-Testing-1', :service => 'ot'})
    response = stub(:code => 200, :body => "SID\nLSID\nAUTH")
    Net::HTTP.any_instance.stubs(:request).returns(response)
    
    impl = OpenSocial::API::Implementor.new(@url)
    impl.client_login(@username, @password)
    assert_equal 'AUTH', impl.token
    assert_equal 'GoogleLogin', impl.login_method
  end
  
  def test_authsub_proxy_authentication
    impl = OpenSocial::API::Implementor.new(@url)
    next_addr = "http://www.return.com/me/here"
    redirect = impl.authsub_proxy(next_addr, :session => 1, :secure => 0)
    
    redirect_params = CGI.parse(URI.parse(redirect).query)
    assert_equal ['1'], redirect_params['session']
    assert_equal ['0'], redirect_params['secure']
    assert_equal [next_addr], redirect_params['next']
    assert_equal [@url], redirect_params['scope']
  end
  
  # person = orkut.people.find(:me) # => OpenSocial::Person
  #  person.friends # => [OpenSocial::Person]
  #  person.activities # => [OpenSocial::Activities]
end