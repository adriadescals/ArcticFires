
library(semTools)
library(lavaan)
library(semPlot)

setwd("G:/My Drive/_ARCTIC_FIRES/_CODE/R1/CLEANED/MAIN/DATA")

# import the data directly from s3 bucket
dat <- read.csv(file = "ARCTIC_TRENDS_merged_v3-3.csv")

head(dat)

cov(scale(dat))
cor(dat)

plot(dat)



#_________________________________________________________________________________

# CFI = 0.958 and NNFI/TLI = 0.935 values around the recommended cut-off criterion of >0.97/0.95 
# RMSEA = 0.055 is slightly above the cut-off of 0.05, but it is not significantly higher than 0.05 (90 % CI = [0.029; 0.079]). 
# SRMR = 0.053 points to a good model fit (SRMR < 0.08).

#_________________________________________________________________________________
# Create model

m3 <- '
vpd ~  LST
LoS ~  LST
ndvi  ~  LST
def ~ vpd +  LoS + ndvi + Rf
Ign ~ def + LST
BA ~ def + Ign
ndvi  ~~  LoS
LST  ~~  Rf
'

fit3 <- sem(m3, data=(dat))
summary(fit3, standardized=TRUE, fit.measures=TRUE)

semPaths(fit3, "std", weighted = FALSE, nCharNodes = 10, shapeMan = "rectangle",
         sizeMan = 8, sizeMan2 = 5, curvePivot = TRUE, layout = "tree2")

modindices(fit3,sort=TRUE, maximum.number = 10)
varTable(fit3)

clipboard(fit3, what = "summary")
clipboard(fit3)


#_________________________________________________________________________________
# Inspect direct and indirect effects



m3 <- '
vpd ~  a*LST
LoS ~  b*LST
ndvi  ~  c*LST
def ~ f*vpd +  g*LoS + h*ndvi + e*Rf
Ign ~ j*def + d*LST
BA ~ i*def + k*Ign
ndvi  ~~  LoS
LST  ~~  Rf
# LST
 LST := a*f*i + b*g*i + c*h*i + a*f*i*j*k + b*g*i*j*k + c*h*i*j*k + d*k
# Rf (total; all indirect)
 Rf := e*i + e*j*k
# VPD (total; all indirect)
 VPD := f*i + f*j*k
# LoS (total; all indirect)
 LoS := g*i + f*j*k
# ndvi (total; all indirect)
 ndvi := h*i + f*j*k
# def (total)
 def := i + j*k
# ign (total; all direct)
 ign := k
# def (indirect)
 def_direct := i
# def (direct)
 def_indirect := j*k
'
fit3 <- sem(m3, data=(dat))
summary(fit3, standardized=TRUE, fit.measures=TRUE)

semPaths(fit3, "std", weighted = FALSE, nCharNodes = 10, shapeMan = "rectangle",
         sizeMan = 8, sizeMan2 = 5, curvePivot = TRUE, layout = "tree2")

# https://rdrr.io/cran/lavaan/man/lavInspect.html
lavInspect(fit3, "rsquare")


#_________________________________________________________________________________
# Alternative model 1

m3 <- '
LST ~  Wd
vpd ~  LST
LoS ~  LST
ndvi  ~  LST
def ~ vpd +  LoS + ndvi + Rf
Ign ~ def + LST
BA ~ def + Ign + Ws
ndvi  ~~  LoS
'


fit3 <- sem(m3, data=scale(dat))
summary(fit3, standardized=TRUE, fit.measures=TRUE)

semPaths(fit3, "std", weighted = FALSE, nCharNodes = 10, shapeMan = "rectangle",
         sizeMan = 8, sizeMan2 = 5, curvePivot = TRUE, layout = "tree2")




#_________________________________________________________________________________
# Alternative model 2

m3 <- '
vpd ~  Ta
LoS ~  Ta
ndvi  ~  Ta
def ~ vpd +  LoS + ndvi + Rf
Ign ~ def + Ta
BA ~ def + Ign
ndvi  ~~  LoS
'


fit3 <- sem(m3, data=(dat))
summary(fit3, standardized=TRUE, fit.measures=TRUE)

semPaths(fit3, "std", weighted = FALSE, nCharNodes = 10, shapeMan = "rectangle",
         sizeMan = 8, sizeMan2 = 5, curvePivot = TRUE, layout = "tree2")




