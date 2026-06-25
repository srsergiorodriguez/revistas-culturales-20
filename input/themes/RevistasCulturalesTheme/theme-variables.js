/*
 * Custom function used to generate the output of the theme variables; more about it can be found at https://getpublii.com/dev/theme-variables/
 */

var generateThemeVariables = function(themeConfig, postConfig, commonConfig, pageConfig) {
   let output = '';

   const rowSectionBorder = themeConfig.rowSectionBorder ? "--pico-border-color: color-mix(in srgb, var(--pico-background-color), white 25%);" : "";

   output += ` 
      :root {
            --pico-font-size: ${themeConfig.fontSize}px;
            ${rowSectionBorder}
      }`;

   return output;
}

module.exports = generateThemeVariables;