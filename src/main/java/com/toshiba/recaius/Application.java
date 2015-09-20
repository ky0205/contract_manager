package com.toshiba.recaius;

import static com.google.common.base.Predicates.containsPattern;
import static com.google.common.base.Predicates.or;

import javax.servlet.MultipartConfigElement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.embedded.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;

import com.google.common.base.Predicate;

import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

@SpringBootApplication
@EnableSwagger2
@EnableAutoConfiguration
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
    
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize("128KB");
        factory.setMaxRequestSize("128KB");
        return factory.createMultipartConfig();
    }
    
    @Bean
    public Docket swaggerSpringMvcPlugin() {
        return new Docket(DocumentationType.SWAGGER_2)
                .select().paths(paths()).build().apiInfo(apiInfo());
        //groupName("business-api")でURLパラメータ?group=businessでアクセスできる
    }

    @SuppressWarnings("unchecked")
    private Predicate<String> paths() {
    	return or(
    			containsPattern("/admin/*"),
    			containsPattern("/group/*"),
    			containsPattern("/model/*"),
    			containsPattern("/speech/*"),
    			containsPattern("/tag/*"),
    			containsPattern("/user/*"),
    			containsPattern("/voice/*"),
    			containsPattern("/version"),
    			containsPattern("/authenticate"),
    			containsPattern("/logout"),
    			containsPattern("/version"));
        //return or(containsPattern("/*"));
    }

    private ApiInfo apiInfo() {
        ApiInfo apiInfo = new ApiInfo(
                "音声ビューアSaaSAPI仕様書", //タイトル
                "音声ビューアSaaSAPI(RESTAPI)の仕様書です。", //詳細
                "0.1.0", //バージョン
                "http://www.yahoo.co.jp", //利用規約URL
                "Kasai.Yasuhiro@toshiba-sol.co.jp", //作者
                "", //ライセンス
                "http://www.google.co.jp" //ライセンスURL
          );
        return apiInfo;
    }
}
