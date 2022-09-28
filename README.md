### This repository contains the code used for the analyses in the paper "Unprecedented fire activity above the Arctic Circle linked to rising temperatures"

The repository is organized as follows:

- The folder “gee” contains Google Earth Engine code for:
	- Classification of annual burned areas with Sentinel-2 (subfolder “gee/AnnualClassif_Arctic/Sentinel2”) 
	- Classification of annual burned areas with Landsat-7 and -8 (subfolder “gee/AnnualClassif_Arctic/Landsat78”) 
	- Extraction of metrics for the sample-based validation of burned area maps
	- Estimation of land surface phenology maps using MODIS and GIMMS NDVI
	- Download of fire regime factor time series

- The folder “main” contains Matlab code and data for:
	- Main analysis of the article, including the detection of ignitions, analysis of trends in factors of fire, analysis of sensitivity of annual burned area to factors of fire, estimation of past fire emissions, and projection of burned area and fire emissions.
	- Preparation of data from original data sources. 
	- Plots presented in the paper.
	- The folder also contains the R script “u01_SEM.R” for structural equation modeling. 

- The zip files “Arctic_BA_Sentinel2_2019-2020_v1-1.zip” and “Arctic_BA_Landsat78_2019-2020_v1-1.zip” contain the geotiff files for the 2019 and 2020 burned area maps created using Sentinel-2 and Landsat-7 and -8 images. These burned area maps can be visualized at https://adriadescals.users.earthengine.app/view/arctic-burnedarea-sentinel2

Adrià Descals - a.descals@creaf.uab.cat CREAF - Centre de Recerca Ecològica i Aplicacions Forestals
