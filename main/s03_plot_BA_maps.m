%% Generate maps for Fig. 1

clear all; close all

% load vector data for coastlines
load coastlines

% load shapefile for Siberian Arctic
ROI = shaperead('./DATA/rawmaps/roi_arctic.shp');

%% Display Siberian Arctic in gnomonic projection
figure
axesm('gnomonic', ...
    'Grid', 'on',...
    'GLineStyle', '-',...
    'GLineWidth', 0.1,...
    'GColor', [.4 .4 .4], ...
    'MLineLocation', 20,...
    'PLineLocation', 5);
setm(gca,'Origin', [90 120]); framem on;
geoshow(ROI.Y,ROI.X,'DisplayType','line','Color', [255 211 0]/255, 'MarkerEdgeColor', 'auto','LineWidth',3)
% geoshow([66.5 66.5 66.5],[arcticLine.X(1:2) 90],'DisplayType','line','Color', [0 0 255]/255, 'MarkerEdgeColor', 'auto')
xlim([-0.47 0.47])
ylim([-0.47 0.47])

% save svg
% set(gcf, 'PaperPositionMode', 'auto')
% saveas(gcf,['./figures/map_outline_arctic_gnomonicR1.svg'])


%% Display burned area map presented in Fig. 1a
[im, R] = geotiffread('./DATA/rawmaps/BAArctic_clean_resPrint_2000.tif');

figure
axesm('gnomonic', ...
    'Grid', 'on',...
    'GLineStyle', '-',...
    'GLineWidth', 0.1,...
    'GColor', [.4 .4 .4], ...
    'MLineLocation', 20,...
    'PLineLocation', 5);
setm(gca,'Origin', [90 120]); framem on;
geoshow(im,R)
% geoshow(ROI.Y,ROI.X,'DisplayType','line','Color', [50 50 50]/255, 'MarkerEdgeColor', 'auto','LineWidth',3)
% geoshow([66.5 66.5 66.5],[arcticLine.X(1:2) 90],'DisplayType','line','Color', [0 0 255]/255, 'MarkerEdgeColor', 'auto')
xlim([-0.47 0.47])
ylim([-0.47 0.47])
pause(0.1)

% save png
% set(gcf,'PaperUnits','centimeters');
% set(gcf,'PaperPosition',[0 0 100 100]);
% saveas(gcf,['./figures/map_BAArctic_all_gnomonicR1.png'])


%% Display peatland map presented in Fig. 1b
[im, R] = geotiffread('./DATA/rawmaps/BAArctic_onlyPeatlands_resPrint_2000.tif');

figure
axesm('gnomonic', ...
    'Grid', 'on',...
    'GLineStyle', '-',...
    'GLineWidth', 0.1,...
    'GColor', [.4 .4 .4], ...
    'MLineLocation', 20,...
    'PLineLocation', 5);
setm(gca,'Origin', [90 120]); framem on;
geoshow(im,R)
xlim([-0.47 0.47])
ylim([-0.47 0.47])

% save png
% set(gcf,'PaperUnits','centimeters');
% set(gcf,'PaperPosition',[0 0 100 100]);
% saveas(gcf,['./figures/map_BAArctic_peat_gnomonicR1.png'])




