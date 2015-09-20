package com.toshiba.recaius.controller;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.toshiba.recaius.entity.InformationEntity;

@RestController
@RequestMapping("/information")
@Api(
		value = "admin", 
		description="契約管理者用API"
)
@Transactional
public class InformationController {
    private static final Logger logger = LoggerFactory.getLogger(InformationController.class);
    
    
    /**
     * 契約情報を取得します。
     * 
     * @param auth
     * @return
     */
    @ApiOperation(
    		httpMethod = "GET",
    		value = "契約情報取得API",
    		notes="契約情報を取得します。",
    		response = InformationEntity.class,
    		nickname="getUser")
    @RequestMapping(value = "/contract", method = { RequestMethod.GET })
    public InformationEntity getInformation(
    		@RequestHeader(value="X-AUTH-TOKEN") String authToken
    		){
        return null;
    }
}
