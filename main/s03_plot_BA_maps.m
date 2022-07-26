clear all; close all

load coastlines

ROI = shaperead('./DATA/rawmaps/roi_arctic.shp');

%% plot2 
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
set(gcf, 'PaperPositionMode', 'auto')
saveas(gcf,['./figures/map_outline_arctic_gnomonicR1.svg'])

% % save png
% set(gcf,'PaperUnits','centimeters');
% set(gcf,'PaperPosition',[0 0 100 100]);
% saveas(gcf,['./figures/outline_arctic.png'])


%% plot3
[im, R] = geotiffread('./DATA/rawmaps/BAArctic_clean_resPrint_2000.tif');
PRJ = {'gnomonic'};

for ii = 1:length(PRJ)
figure
axesm(PRJ{ii}, ...
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
title(PRJ{ii})
pause(0.1)

end

% save png
set(gcf,'PaperUnits','centimeters');
set(gcf,'PaperPosition',[0 0 100 100]);
saveas(gcf,['./figures/map_BAArctic_all_gnomonicR1.png'])



%% plot4
[imR0, R] = geotiffread('./DATA/rawmaps/BAArctic_onlyPeatlands_resPrint_2000_R0.tif');
[im, R] = geotiffread('./DATA/rawmaps/BAArctic_onlyPeatlands_resPrint_2000.tif');

im(imR0==255) = 255;
figure, imagesc(im)
figure, imagesc(imR0)

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

% save png
set(gcf,'PaperUnits','centimeters');
set(gcf,'PaperPosition',[0 0 100 100]);
saveas(gcf,['./figures/map_BAArctic_peat_gnomonicR1.png'])




